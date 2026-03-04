import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { events } from './events';

// ─── Enums ────────────────────────────────────────────────
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'paused', 'ended']);

// ─── Voting Campaigns ─────────────────────────────────────
export const votingCampaigns = pgTable('voting_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: campaignStatusEnum('status').notNull().default('draft'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  allowMultipleVotes: boolean('allow_multiple_votes').notNull().default(false),
  votesPerUser: integer('votes_per_user').notNull().default(1),
  isPaid: boolean('is_paid').notNull().default(false),
  votePrice: numeric('vote_price', { precision: 10, scale: 2 }),
  currency: text('currency').notNull().default('NGN'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Voting Categories ────────────────────────────────────
export const votingCategories = pgTable('voting_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => votingCampaigns.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Contestants ──────────────────────────────────────────
export const contestants = pgTable('contestants', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => votingCategories.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').notNull().references(() => votingCampaigns.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  photoUrl: text('photo_url'),
  code: text('code'),
  voteCount: integer('vote_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Votes ────────────────────────────────────────────────
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => votingCampaigns.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => votingCategories.id, { onDelete: 'cascade' }),
  contestantId: uuid('contestant_id').notNull().references(() => contestants.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  voterIdentifier: text('voter_identifier'), // email or anonymous token
  voteCount: integer('vote_count').notNull().default(1),
  isPaid: boolean('is_paid').notNull().default(false),
  paymentReference: text('payment_reference'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type VotingCampaign = typeof votingCampaigns.$inferSelect;
export type NewVotingCampaign = typeof votingCampaigns.$inferInsert;
export type VotingCategory = typeof votingCategories.$inferSelect;
export type NewVotingCategory = typeof votingCategories.$inferInsert;
export type Contestant = typeof contestants.$inferSelect;
export type NewContestant = typeof contestants.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
