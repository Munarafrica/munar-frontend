import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { votingCampaigns, votingCategories, contestants, votes, events } from '../db/schema';
import { sendSuccess, sendError } from '../lib/response';
import { z } from 'zod';

async function assertEventOwner(eventId: string, userId: string, res: Response): Promise<boolean> {
  const [ev] = await db.select({ id: events.id }).from(events)
    .where(and(eq(events.id, eventId), eq(events.ownerId, userId))).limit(1);
  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return false; }
  return true;
}

// ─── Campaigns ────────────────────────────────────────────
export async function getCampaigns(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(votingCampaigns).where(eq(votingCampaigns.eventId, req.params.eventId));
  sendSuccess(res, rows);
}

export async function createCampaign(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const schema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'paused', 'ended']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    allowMultipleVotes: z.boolean().optional(),
    votesPerUser: z.number().int().optional(),
    isPaid: z.boolean().optional(),
    votePrice: z.number().optional(),
    currency: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const [row] = await db.insert(votingCampaigns).values({
    eventId: req.params.eventId,
    ...parsed.data,
    votePrice: parsed.data.votePrice?.toString(),
  }).returning();
  sendSuccess(res, row, 'Campaign created', 201);
}

export async function updateCampaign(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const schema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'paused', 'ended']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const [row] = await db.update(votingCampaigns).set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(votingCampaigns.id, req.params.campaignId), eq(votingCampaigns.eventId, req.params.eventId)))
    .returning();
  if (!row) { sendError(res, 'Campaign not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}

export async function deleteCampaign(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  await db.delete(votingCampaigns)
    .where(and(eq(votingCampaigns.id, req.params.campaignId), eq(votingCampaigns.eventId, req.params.eventId)));
  sendSuccess(res, { id: req.params.campaignId });
}

// ─── Categories ───────────────────────────────────────────
export async function getCategories(req: Request, res: Response) {
  const rows = await db.select().from(votingCategories)
    .where(eq(votingCategories.campaignId, req.params.campaignId));
  sendSuccess(res, rows);
}

export async function createCategory(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const schema = z.object({ name: z.string().min(1), description: z.string().optional(), order: z.number().int().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const [row] = await db.insert(votingCategories).values({
    campaignId: req.params.campaignId,
    eventId: req.params.eventId,
    ...parsed.data,
  }).returning();
  sendSuccess(res, row, 'Category created', 201);
}

// ─── Contestants ──────────────────────────────────────────
export async function getContestants(req: Request, res: Response) {
  const rows = await db.select().from(contestants)
    .where(eq(contestants.categoryId, req.params.categoryId));
  sendSuccess(res, rows);
}

export async function createContestant(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    photoUrl: z.string().url().optional(),
    code: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  const [row] = await db.insert(contestants).values({
    categoryId: req.params.categoryId,
    campaignId: req.params.campaignId,
    eventId: req.params.eventId,
    ...parsed.data,
  }).returning();
  sendSuccess(res, row, 'Contestant created', 201);
}

// ─── Cast Vote (public) ───────────────────────────────────
export async function castVote(req: Request, res: Response) {
  const schema = z.object({
    contestantId: z.string().uuid(),
    voterIdentifier: z.string().optional(),
    voteCount: z.number().int().positive().default(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }

  const [contestant] = await db.select().from(contestants)
    .where(and(eq(contestants.id, parsed.data.contestantId), eq(contestants.campaignId, req.params.campaignId))).limit(1);
  if (!contestant) { sendError(res, 'Contestant not found', 404, 'NOT_FOUND'); return; }

  const [vote] = await db.insert(votes).values({
    campaignId: req.params.campaignId,
    categoryId: contestant.categoryId,
    contestantId: contestant.id,
    eventId: contestant.eventId,
    voterIdentifier: parsed.data.voterIdentifier,
    voteCount: parsed.data.voteCount,
  }).returning();

  // Update contestant vote count
  await db.update(contestants)
    .set({ voteCount: contestant.voteCount + parsed.data.voteCount, updatedAt: new Date() })
    .where(eq(contestants.id, contestant.id));

  sendSuccess(res, vote, 'Vote cast', 201);
}
