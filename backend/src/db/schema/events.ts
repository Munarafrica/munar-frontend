import { pgTable, text, timestamp, boolean, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────
export const eventTypeEnum = pgEnum('event_type', ['Physical', 'Virtual', 'Hybrid']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'unpublished']);
export const eventPhaseEnum = pgEnum('event_phase', ['setup', 'live', 'post-event']);

// ─── Events ───────────────────────────────────────────────
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  startDate: text('start_date').notNull(),
  startTime: text('start_time').notNull(),
  endDate: text('end_date'),
  endTime: text('end_time'),
  type: eventTypeEnum('type').notNull().default('Physical'),
  status: eventStatusEnum('status').notNull().default('draft'),
  phase: eventPhaseEnum('phase').notNull().default('setup'),
  coverImageUrl: text('cover_image_url'),
  country: text('country'),
  venueLocation: text('venue_location'),
  websiteUrl: text('website_url'),
  subdomain: text('subdomain').unique(),
  customDomain: text('custom_domain').unique(),
  categories: jsonb('categories').$type<string[]>().default([]),
  currency: text('currency').notNull().default('NGN'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringConfig: jsonb('recurring_config'),
  branding: jsonb('branding'),
  enabledModules: jsonb('enabled_modules'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
