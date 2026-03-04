import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { events } from './events';

// ─── Enums ────────────────────────────────────────────────
export const productTypeEnum = pgEnum('product_type', ['physical', 'digital']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'sold-out', 'archived']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded']);

// ─── Products ─────────────────────────────────────────────
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  type: productTypeEnum('type').notNull().default('physical'),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  images: jsonb('images').notNull().default([]),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  sku: text('sku'),
  category: text('category'),
  tags: jsonb('tags').$type<string[]>().default([]),
  status: productStatusEnum('status').notNull().default('draft'),
  hasVariants: boolean('has_variants').notNull().default(false),
  variants: jsonb('variants').notNull().default([]),
  unlimitedInventory: boolean('unlimited_inventory').notNull().default(false),
  totalStock: integer('total_stock').notNull().default(0),
  reservedStock: integer('reserved_stock').notNull().default(0),
  soldCount: integer('sold_count').notNull().default(0),
  fulfilmentType: text('fulfilment_type').notNull().default('pickup'),
  digitalFiles: jsonb('digital_files'),
  restrictions: jsonb('restrictions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Merchandise Orders ───────────────────────────────────
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  items: jsonb('items').notNull().default([]),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: orderStatusEnum('status').notNull().default('pending'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentReference: text('payment_reference'),
  shippingAddress: jsonb('shipping_address'),
  fulfilmentNotes: text('fulfilment_notes'),
  fulfilledAt: timestamp('fulfilled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
