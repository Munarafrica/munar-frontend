import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { events } from './events';

// ─── Speakers ─────────────────────────────────────────────
export const speakers = pgTable('speakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title'),           // maps to frontend `role`
  organization: text('organization'),
  bio: text('bio'),
  photoUrl: text('photo_url'),    // maps to frontend `imageUrl`
  email: text('email'),
  categories: jsonb('categories').$type<string[]>().notNull().default([]),
  socials: jsonb('socials').$type<{ twitter?: string; linkedin?: string; website?: string }>(),
  isFeatured: boolean('is_featured').notNull().default(false),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Tracks ───────────────────────────────────────────────
export const tracks = pgTable('tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  description: text('description'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Sessions ─────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull().default('talk'), // talk | workshop | panel | break | keynote
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  date: text('date').notNull(),
  location: text('location'),
  speakerIds: jsonb('speaker_ids').$type<string[]>().default([]),
  capacity: integer('capacity'),
  isBreak: boolean('is_break').notNull().default(false),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Speaker = typeof speakers.$inferSelect;
export type NewSpeaker = typeof speakers.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
