import { pgTable, text, timestamp, boolean, integer, serial } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
})

export const profile = pgTable('profile', {
  userId: text('userId').primaryKey(),
  role: text('role').notNull().default('user'),
  coins: integer('coins').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const botTemplate = pgTable('bot_template', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  imageUrl: text('imageUrl'),
  repoUrl: text('repoUrl').notNull(),
  branch: text('branch').notNull().default('main'),
  pairLink: text('pairLink'),
  cost: integer('cost').notNull().default(0),
  sessionEnvKey: text('sessionEnvKey').notNull().default('SESSION_ID'),
  active: boolean('active').notNull().default(true),
  createdBy: text('createdBy').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const deployment = pgTable('deployment', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  templateId: integer('templateId').notNull(),
  appName: text('appName').notNull(),
  status: text('status').notNull().default('pending'),
  herokuAppId: text('herokuAppId'),
  herokuSetupId: text('herokuSetupId'),
  appUrl: text('appUrl'),
  cost: integer('cost').notNull().default(0),
  error: text('error'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const coinTransaction = pgTable('coin_transaction', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  actorId: text('actorId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type Role = 'admin' | 'subadmin' | 'user'
export type BotTemplate = typeof botTemplate.$inferSelect
export type Deployment = typeof deployment.$inferSelect
