import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────
export const accountTypeEnum = pgEnum('account_type', ['individual', 'organization']);
export const currencyEnum = pgEnum('currency', ['NGN', 'GHS', 'ZAR', 'USD', 'GBP', 'EUR']);

// ─── Users ───────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  organization: text('organization'),
  avatarUrl: text('avatar_url'),
  accountType: accountTypeEnum('account_type').notNull().default('individual'),
  currency: text('currency').notNull().default('NGN'),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  emailVerificationToken: text('email_verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Refresh tokens ───────────────────────────────────────
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
