import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { events } from './events';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────
export const ticketStatusEnum = pgEnum('ticket_status', ['Draft', 'On Sale', 'Sold Out', 'Hidden']);
export const ticketTypeEnum = pgEnum('ticket_type', ['Single', 'Group']);
export const ticketVisibilityEnum = pgEnum('ticket_visibility', ['Public', 'Hidden', 'Invite Only']);
export const refundPolicyEnum = pgEnum('refund_policy', ['Refundable', 'Non-refundable']);
export const ticketOrderStatusEnum = pgEnum('ticket_order_status', ['pending', 'completed', 'refunded', 'cancelled']);
export const questionTypeEnum = pgEnum('question_type', ['text', 'dropdown', 'checkbox']);

// ─── Tickets ──────────────────────────────────────────────
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: ticketTypeEnum('type').notNull().default('Single'),
  groupSize: integer('group_size'),
  isFree: boolean('is_free').notNull().default(false),
  price: numeric('price', { precision: 12, scale: 2 }),
  quantityTotal: integer('quantity_total').notNull(),
  quantitySold: integer('quantity_sold').notNull().default(0),
  status: ticketStatusEnum('status').notNull().default('Draft'),
  salesStart: text('sales_start').notNull(),
  salesEnd: text('sales_end').notNull(),
  minPerOrder: integer('min_per_order').notNull().default(1),
  maxPerOrder: integer('max_per_order').notNull().default(10),
  visibility: ticketVisibilityEnum('visibility').notNull().default('Public'),
  description: text('description'),
  perks: jsonb('perks').$type<Array<{ id: string; name: string }>>().default([]),
  allowTransfer: boolean('allow_transfer').notNull().default(false),
  allowResale: boolean('allow_resale').notNull().default(false),
  refundPolicy: refundPolicyEnum('refund_policy').notNull().default('Non-refundable'),
  requireAttendeeInfo: boolean('require_attendee_info').notNull().default(false),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Attendees ────────────────────────────────────────────
export const attendeeStatusEnum = pgEnum('attendee_status', ['registered', 'checked-in', 'cancelled']);

export const attendees = pgTable('attendees', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  orderReference: text('order_reference').notNull(),
  qrCode: text('qr_code'),
  status: attendeeStatusEnum('status').notNull().default('registered'),
  checkedInAt: timestamp('checked_in_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Ticket Orders ────────────────────────────────────────
export const ticketOrders = pgTable('ticket_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  orderReference: text('order_reference').notNull().unique(),
  buyerName: text('buyer_name').notNull(),
  buyerEmail: text('buyer_email').notNull(),
  buyerPhone: text('buyer_phone'),
  currency: text('currency').notNull().default('NGN'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: ticketOrderStatusEnum('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  items: jsonb('items').$type<Array<{ ticketId: string; ticketName: string; quantity: number; unitPrice: number }>>().notNull(),
  questionAnswers: jsonb('question_answers').$type<Array<{ questionId: string; questionLabel: string; answer: string }>>(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Checkout Questions ───────────────────────────────────
export const ticketQuestions = pgTable('ticket_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  type: questionTypeEnum('type').notNull().default('text'),
  required: boolean('required').notNull().default(false),
  ticketIds: jsonb('ticket_ids').$type<string[]>().notNull().default(['all']),
  options: jsonb('options').$type<string[]>().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Ticket Settings (per-event global settings) ──────────
export const ticketSettings = pgTable('ticket_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }).unique(),
  enableTransfers: boolean('enable_transfers').notNull().default(true),
  enableResale: boolean('enable_resale').notNull().default(false),
  resaleCap: integer('resale_cap').default(10),
  refundPolicy: text('refund_policy').notNull().default('flexible'),
  supportEmail: text('support_email'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Type Exports ─────────────────────────────────────────
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Attendee = typeof attendees.$inferSelect;
export type NewAttendee = typeof attendees.$inferInsert;
export type TicketOrder = typeof ticketOrders.$inferSelect;
export type NewTicketOrder = typeof ticketOrders.$inferInsert;
export type TicketQuestion = typeof ticketQuestions.$inferSelect;
export type NewTicketQuestion = typeof ticketQuestions.$inferInsert;
export type TicketSetting = typeof ticketSettings.$inferSelect;
export type NewTicketSetting = typeof ticketSettings.$inferInsert;
