import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { events } from './events';

// ─── Sponsors ─────────────────────────────────────────────
export const sponsors = pgTable('sponsors', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  description: text('description'),
  visible: boolean('visible').notNull().default(true),
  order: integer('order').notNull().default(0),
  tier: text('tier'), // e.g. 'Gold', 'Silver', 'Bronze'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
