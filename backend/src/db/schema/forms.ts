import { pgTable, text, timestamp, integer, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { events } from './events';

// ─── Forms ────────────────────────────────────────────────
export const formStatusEnum = pgEnum('form_status', ['draft', 'published', 'closed', 'scheduled']);
export const formTypeEnum   = pgEnum('form_type',   ['registration', 'survey', 'feedback', 'custom']);

export const forms = pgTable('forms', {
  id:            uuid('id').primaryKey().defaultRandom(),
  eventId:       uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title:         text('title').notNull(),
  description:   text('description'),
  type:          formTypeEnum('type').notNull().default('custom'),
  status:        formStatusEnum('status').notNull().default('draft'),
  fields:        jsonb('fields').notNull().default([]),
  settings:      jsonb('settings'),
  shareToken:    text('share_token').unique(),
  responseCount: integer('response_count').notNull().default(0),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
});

// ─── Form Responses ───────────────────────────────────────
export const formResponses = pgTable('form_responses', {
  id:               uuid('id').primaryKey().defaultRandom(),
  formId:           uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  eventId:          uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  respondentName:   text('respondent_name'),
  respondentEmail:  text('respondent_email'),
  answers:          jsonb('answers').notNull().default({}),
  metadata:         jsonb('metadata'),
  submittedAt:      timestamp('submitted_at').notNull().defaultNow(),
});

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormResponse = typeof formResponses.$inferSelect;
export type NewFormResponse = typeof formResponses.$inferInsert;
