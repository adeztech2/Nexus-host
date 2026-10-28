import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profile, type Role } from '@/lib/db/schema'

export type Viewer = {
  id: string
  name: string
  email: string
  role: Role
  coins: number
}

async function ensureProfile(userId: string) {
  const [existing] = await db.select().from(profile).where(eq(profile.userId, userId))
  if (existing) return existing

  // The very first account on a fresh install becomes the owner admin.
  const [anyAdmin] = await db
    .select({ userId: profile.userId })
    .from(profile)
    .where(eq(profile.role, 'admin'))
    .limit(1)

  const [created] = await db
    .insert(profile)
    .values({ userId, role: anyAdmin ? 'user' : 'admin', coins: 0 })
    .onConflictDoNothing()
    .returning()

  if (created) return created
  const [row] = await db.select().from(profile).where(eq(profile.userId, userId))
  return row
}

export async function getViewer(): Promise<Viewer | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const p = await ensureProfile(session.user.id)
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: p.role as Role,
    coins: p.coins,
  }
}

export async function requireViewer() {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in')
  return viewer
}

export function isStaff(role: Role) {
  return role === 'admin' || role === 'subadmin'
}

export async function requireStaff() {
  const viewer = await requireViewer()
  if (!isStaff(viewer.role)) redirect('/dashboard')
  return viewer
}

export async function assertStaff() {
  const viewer = await getViewer()
  if (!viewer || !isStaff(viewer.role)) throw new Error('Forbidden')
  return viewer
}

export async function assertAdmin() {
  const viewer = await getViewer()
  if (!viewer || viewer.role !== 'admin') throw new Error('Forbidden')
  return viewer
}

export async function assertViewer() {
  const viewer = await getViewer()
  if (!viewer) throw new Error('Unauthorized')
  return viewer
}
