import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { sponsors, events } from '../db/schema';
import { sendSuccess, sendError } from '../lib/response';
import { z } from 'zod';

async function assertEventOwner(eventId: string, userId: string, res: Response): Promise<boolean> {
  const [ev] = await db.select({ id: events.id }).from(events)
    .where(and(eq(events.id, eventId), eq(events.ownerId, userId))).limit(1);
  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return false; }
  return true;
}

const sponsorSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  description: z.string().optional(),
  visible: z.boolean().default(true),
  order: z.number().int().optional(),
  tier: z.string().optional(),
});

export async function getSponsors(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(sponsors).where(eq(sponsors.eventId, req.params.eventId))
    .orderBy(sponsors.order);
  sendSuccess(res, rows);
}

export async function createSponsor(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = sponsorSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const [row] = await db.insert(sponsors).values({ eventId: req.params.eventId, ...parsed.data }).returning();
  sendSuccess(res, row, 'Sponsor created', 201);
}

export async function updateSponsor(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = sponsorSchema.partial().safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const [row] = await db.update(sponsors).set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(sponsors.id, req.params.id), eq(sponsors.eventId, req.params.eventId))).returning();
  if (!row) { sendError(res, 'Sponsor not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}

export async function deleteSponsor(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  await db.delete(sponsors).where(and(eq(sponsors.id, req.params.id), eq(sponsors.eventId, req.params.eventId)));
  sendSuccess(res, { id: req.params.id });
}
