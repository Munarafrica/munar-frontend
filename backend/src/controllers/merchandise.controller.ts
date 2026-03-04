import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { products, orders, events } from '../db/schema';
import { sendSuccess, sendError } from '../lib/response';
import { z } from 'zod';

async function assertEventOwner(eventId: string, userId: string, res: Response): Promise<boolean> {
  const [ev] = await db.select({ id: events.id }).from(events)
    .where(and(eq(events.id, eventId), eq(events.ownerId, userId))).limit(1);
  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return false; }
  return true;
}

const productSchema = z.object({
  type: z.enum(['physical', 'digital']).default('physical'),
  name: z.string().min(1),
  description: z.string().default(''),
  images: z.array(z.any()).optional(),
  price: z.number().positive(),
  currency: z.string().default('NGN'),
  sku: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'sold-out', 'archived']).optional(),
  hasVariants: z.boolean().default(false),
  variants: z.array(z.any()).optional(),
  unlimitedInventory: z.boolean().default(false),
  totalStock: z.number().int().default(0),
  fulfilmentType: z.string().default('pickup'),
});

// ─── Products ─────────────────────────────────────────────
export async function getProducts(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(products).where(eq(products.eventId, req.params.eventId));
  sendSuccess(res, rows);
}

export async function createProduct(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const { price, images, variants, tags, ...rest } = parsed.data;
  const [row] = await db.insert(products).values({
    eventId: req.params.eventId,
    ...rest,
    price: price.toString(),
    images: images ?? [],
    variants: variants ?? [],
    tags: tags ?? [],
  }).returning();
  sendSuccess(res, row, 'Product created', 201);
}

export async function updateProduct(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const data = { ...parsed.data, price: parsed.data.price?.toString(), updatedAt: new Date() };
  const [row] = await db.update(products).set(data)
    .where(and(eq(products.id, req.params.id), eq(products.eventId, req.params.eventId))).returning();
  if (!row) { sendError(res, 'Product not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}

export async function deleteProduct(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  await db.delete(products).where(and(eq(products.id, req.params.id), eq(products.eventId, req.params.eventId)));
  sendSuccess(res, { id: req.params.id });
}

// ─── Orders ───────────────────────────────────────────────
export async function getOrders(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(orders).where(eq(orders.eventId, req.params.eventId));
  sendSuccess(res, rows);
}

export async function updateOrderStatus(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const schema = z.object({ status: z.enum(['pending', 'paid', 'fulfilled', 'cancelled', 'refunded']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }

  const fulfilledAt = parsed.data.status === 'fulfilled' ? new Date() : undefined;

  const [row] = await db.update(orders).set({
    status: parsed.data.status,
    ...(fulfilledAt ? { fulfilledAt } : {}),
    updatedAt: new Date(),
  })
    .where(and(eq(orders.id, req.params.id), eq(orders.eventId, req.params.eventId))).returning();
  if (!row) { sendError(res, 'Order not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}
