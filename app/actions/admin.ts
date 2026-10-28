'use server'

import { and, eq, gte, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { botTemplate, coinTransaction, profile, user } from '@/lib/db/schema'
import { assertAdmin, assertStaff } from '@/lib/session'
import { int, isGithubRepo, isHttpsUrl, str, type ActionState } from '@/lib/validate'

export async function grantCoins(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await assertStaff()
  const userId = str(formData, 'userId', 100)
  const amount = int(formData, 'amount')
  const reason = str(formData, 'reason', 120) || (amount > 0 ? 'Coins granted by staff' : 'Coins removed by staff')

  if (!userId) return { error: 'Missing user.' }
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 1_000_000)
    return { error: 'Enter a non-zero whole number up to 1,000,000.' }

  const [target] = await db.select({ userId: profile.userId }).from(profile).where(eq(profile.userId, userId))
  if (!target) return { error: 'User not found.' }

  const updated = await db
    .update(profile)
    .set({ coins: sql`${profile.coins} + ${amount}` })
    .where(amount < 0 ? and(eq(profile.userId, userId), gte(profile.coins, -amount)) : eq(profile.userId, userId))
    .returning({ coins: profile.coins })
  if (updated.length === 0) return { error: 'User does not have enough coins to remove that amount.' }

  await db.insert(coinTransaction).values({ userId, amount, reason, actorId: actor.id })
  revalidatePath('/admin')
  return { success: `Balance updated to ${updated[0].coins} coins.` }
}

export async function addSubAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin()
  const email = str(formData, 'email', 200).toLowerCase()
  if (!email.includes('@')) return { error: 'Enter a valid email.' }

  const [target] = await db.select({ id: user.id }).from(user).where(eq(sql`lower(${user.email})`, email))
  if (!target) return { error: 'No account with that email. Ask them to sign up first.' }

  const [p] = await db.select().from(profile).where(eq(profile.userId, target.id))
  if (p?.role === 'admin') return { error: 'That user is already the owner admin.' }

  await db
    .insert(profile)
    .values({ userId: target.id, role: 'subadmin', coins: 0 })
    .onConflictDoUpdate({ target: profile.userId, set: { role: 'subadmin' } })
  revalidatePath('/admin')
  return { success: `${email} is now a sub admin.` }
}

export async function removeSubAdmin(userId: string) {
  const actor = await assertAdmin()
  if (userId === actor.id) throw new Error('You cannot change your own role')
  await db
    .update(profile)
    .set({ role: 'user' })
    .where(and(eq(profile.userId, userId), eq(profile.role, 'subadmin')))
  revalidatePath('/admin')
}

function parseTemplate(formData: FormData) {
  const name = str(formData, 'name', 80)
  const description = str(formData, 'description', 1000)
  const imageUrl = str(formData, 'imageUrl', 1000)
  const repoUrl = str(formData, 'repoUrl', 300).replace(/\/$/, '')
  const branch = str(formData, 'branch', 100) || 'main'
  const pairLink = str(formData, 'pairLink', 1000)
  const sessionEnvKey = str(formData, 'sessionEnvKey', 60) || 'SESSION_ID'
  const cost = int(formData, 'cost')

  if (name.length < 2) return { error: 'Bot name is required.' } as const
  if (!isGithubRepo(repoUrl)) return { error: 'Repository must look like https://github.com/owner/repo' } as const
  if (!/^[\w./-]+$/.test(branch)) return { error: 'Invalid branch name.' } as const
  if (pairLink && !isHttpsUrl(pairLink)) return { error: 'Pair link must be an https URL.' } as const
  if (imageUrl && !isHttpsUrl(imageUrl) && !imageUrl.startsWith('/'))
    return { error: 'Image must be an https URL.' } as const
  if (!/^[A-Z_][A-Z0-9_]*$/.test(sessionEnvKey))
    return { error: 'Session env key must be UPPER_SNAKE_CASE, e.g. SESSION_ID.' } as const
  if (!Number.isInteger(cost) || cost < 0 || cost > 1_000_000) return { error: 'Cost must be 0 or more coins.' } as const

  return {
    data: {
      name,
      description,
      imageUrl: imageUrl || null,
      repoUrl,
      branch,
      pairLink: pairLink || null,
      sessionEnvKey,
      cost,
    },
  } as const
}

export async function saveTemplate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await assertStaff()
  const parsed = parseTemplate(formData)
  if ('error' in parsed) return { error: parsed.error }

  const id = int(formData, 'id')
  if (Number.isInteger(id)) {
    await db.update(botTemplate).set(parsed.data).where(eq(botTemplate.id, id))
  } else {
    await db.insert(botTemplate).values({ ...parsed.data, createdBy: actor.id })
  }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/')
  redirect('/admin?tab=templates')
}

export async function toggleTemplate(id: number, active: boolean) {
  await assertStaff()
  await db.update(botTemplate).set({ active }).where(eq(botTemplate.id, id))
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/')
}

export async function deleteTemplate(id: number) {
  await assertStaff()
  await db.delete(botTemplate).where(eq(botTemplate.id, id))
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/')
}
