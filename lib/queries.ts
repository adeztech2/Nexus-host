import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { botTemplate, deployment, profile, user } from '@/lib/db/schema'

export function getActiveTemplates() {
  return db.select().from(botTemplate).where(eq(botTemplate.active, true)).orderBy(desc(botTemplate.createdAt))
}

export function getAllTemplates() {
  return db.select().from(botTemplate).orderBy(desc(botTemplate.createdAt))
}

const deploymentFields = {
  id: deployment.id,
  appName: deployment.appName,
  status: deployment.status,
  appUrl: deployment.appUrl,
  error: deployment.error,
  cost: deployment.cost,
  createdAt: deployment.createdAt,
  templateName: botTemplate.name,
}

export function getUserDeployments(userId: string) {
  return db
    .select(deploymentFields)
    .from(deployment)
    .leftJoin(botTemplate, eq(botTemplate.id, deployment.templateId))
    .where(eq(deployment.userId, userId))
    .orderBy(desc(deployment.createdAt))
}

export function getAllDeployments() {
  return db
    .select({ ...deploymentFields, ownerEmail: user.email })
    .from(deployment)
    .leftJoin(botTemplate, eq(botTemplate.id, deployment.templateId))
    .leftJoin(user, eq(user.id, deployment.userId))
    .orderBy(desc(deployment.createdAt))
    .limit(200)
}

export function getAllUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      role: profile.role,
      coins: profile.coins,
    })
    .from(user)
    .leftJoin(profile, eq(profile.userId, user.id))
    .orderBy(desc(user.createdAt))
}
