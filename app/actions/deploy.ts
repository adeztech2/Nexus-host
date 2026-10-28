'use server'

import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { botTemplate, coinTransaction, deployment, profile } from '@/lib/db/schema'
import { assertViewer } from '@/lib/session'
import { createAppSetup, deleteApp, getApp, getAppSetup, githubTarballUrl, restartApp } from '@/lib/heroku'
import { APP_NAME_RE, int, str, type ActionState } from '@/lib/validate'

async function refund(userId: string, amount: number, reason: string) {
  if (amount <= 0) return
  await db
    .update(profile)
    .set({ coins: sql`${profile.coins} + ${amount}` })
    .where(eq(profile.userId, userId))
  await db.insert(coinTransaction).values({ userId, amount, reason })
}

export async function deployBot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await assertViewer()
  const templateId = int(formData, 'templateId')
  const appName = str(formData, 'appName', 30).toLowerCase()
  const sessionId = str(formData, 'sessionId', 8000)

  if (!Number.isInteger(templateId)) return { error: 'Invalid template.' }
  if (!APP_NAME_RE.test(appName))
    return { error: 'App name must be 3-30 chars: lowercase letters, numbers and dashes, starting with a letter.' }
  if (sessionId.length < 4) return { error: 'Paste the session ID you got from the pair link.' }

  const [template] = await db
    .select()
    .from(botTemplate)
    .where(and(eq(botTemplate.id, templateId), eq(botTemplate.active, true)))
  if (!template) return { error: 'This bot template is not available.' }

  let tarballUrl: string
  try {
    tarballUrl = githubTarballUrl(template.repoUrl, template.branch)
  } catch {
    return { error: 'This template has an invalid repository. Contact an admin.' }
  }

  const cost = template.cost
  if (cost > 0) {
    const charged = await db
      .update(profile)
      .set({ coins: sql`${profile.coins} - ${cost}` })
      .where(and(eq(profile.userId, viewer.id), gte(profile.coins, cost)))
      .returning({ coins: profile.coins })
    if (charged.length === 0) return { error: `Not enough coins. This bot costs ${cost} coins.` }
    await db
      .insert(coinTransaction)
      .values({ userId: viewer.id, amount: -cost, reason: `Deploy ${template.name} (${appName})` })
  }

  const [row] = await db
    .insert(deployment)
    .values({ userId: viewer.id, templateId: template.id, appName, cost, status: 'pending' })
    .returning({ id: deployment.id })

  try {
    const setup = await createAppSetup({
      appName,
      tarballUrl,
      env: { [template.sessionEnvKey]: sessionId },
    })
    await db
      .update(deployment)
      .set({ status: 'building', herokuSetupId: setup.id, herokuAppId: setup.app.id })
      .where(eq(deployment.id, row.id))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Heroku deploy failed'
    console.error('[nexus] Heroku app setup failed:', message)
    await db.update(deployment).set({ status: 'failed', error: message }).where(eq(deployment.id, row.id))
    await refund(viewer.id, cost, `Refund: failed deploy (${appName})`)
    revalidatePath('/dashboard')
    return { error: `Deploy failed: ${message}` }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard?deployed=1')
}

export async function syncUserDeployments(userId: string) {
  const building = await db
    .select()
    .from(deployment)
    .where(and(eq(deployment.userId, userId), inArray(deployment.status, ['building'])))

  await Promise.all(
    building.map(async (d) => {
      if (!d.herokuSetupId) return
      try {
        const setup = await getAppSetup(d.herokuSetupId)
        if (setup.status === 'succeeded') {
          const app = await getApp(setup.app.id).catch(() => null)
          await db
            .update(deployment)
            .set({ status: 'running', appUrl: app?.web_url ?? null })
            .where(eq(deployment.id, d.id))
        } else if (setup.status === 'failed') {
          const updated = await db
            .update(deployment)
            .set({ status: 'failed', error: setup.failure_message ?? 'Build failed on Heroku' })
            .where(and(eq(deployment.id, d.id), eq(deployment.status, 'building')))
            .returning({ id: deployment.id })
          if (updated.length) await refund(d.userId, d.cost, `Refund: build failed (${d.appName})`)
        }
      } catch (err) {
        console.error('[nexus] status sync failed:', err instanceof Error ? err.message : err)
      }
    }),
  )
}

export async function refreshDeployments() {
  const viewer = await assertViewer()
  await syncUserDeployments(viewer.id)
  revalidatePath('/dashboard')
}

export async function restartDeployment(id: number): Promise<ActionState> {
  const viewer = await assertViewer()
  const [d] = await db
    .select()
    .from(deployment)
    .where(and(eq(deployment.id, id), eq(deployment.userId, viewer.id)))
  if (!d?.herokuAppId || d.status !== 'running') return { error: 'Only running bots can be restarted.' }
  try {
    await restartApp(d.herokuAppId)
    return { success: 'Restart requested.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Restart failed' }
  }
}

export async function deleteDeployment(id: number): Promise<ActionState> {
  const viewer = await assertViewer()
  const [d] = await db
    .select()
    .from(deployment)
    .where(and(eq(deployment.id, id), eq(deployment.userId, viewer.id)))
  if (!d) return { error: 'Deployment not found.' }
  if (d.herokuAppId) {
    try {
      await deleteApp(d.herokuAppId)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (!/not found|couldn't find/i.test(message)) return { error: `Could not delete Heroku app: ${message}` }
    }
  }
  await db.delete(deployment).where(and(eq(deployment.id, id), eq(deployment.userId, viewer.id)))
  revalidatePath('/dashboard')
  return { success: 'Bot deleted.' }
}
