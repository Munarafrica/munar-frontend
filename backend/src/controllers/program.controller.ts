import { Request, Response } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '../db';
import { speakers, sessions, tracks, events } from '../db/schema';
import { sendSuccess, sendError } from '../lib/response';
import { z } from 'zod';

// --- Auth helpers ---
async function assertEventOwner(eventId: string, userId: string, res: Response): Promise<boolean> {
  const [ev] = await db.select({ id: events.id }).from(events)
    .where(and(eq(events.id, eventId), eq(events.ownerId, userId))).limit(1);
  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return false; }
  return true;
}

async function assertEventExists(eventId: string, res: Response): Promise<boolean> {
  const [ev] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return false; }
  return true;
}

// --- Shape helpers ---
type SpeakerRow = typeof speakers.$inferSelect;
type TrackRow = typeof tracks.$inferSelect;
type SessionRow = typeof sessions.$inferSelect;

function speakerToFrontend(row: SpeakerRow) {
  return {
    id: row.id,
    name: row.name,
    role: row.title ?? '',
    organization: row.organization ?? undefined,
    bio: row.bio ?? '',
    imageUrl: row.photoUrl ?? undefined,
    email: row.email ?? undefined,
    linkedInUrl: (row.socials as any)?.linkedin ?? undefined,
    twitterUrl: (row.socials as any)?.twitter ?? undefined,
    websiteUrl: (row.socials as any)?.website ?? undefined,
    categories: (row.categories as string[]) ?? [],
    isFeatured: row.isFeatured,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function sessionToFrontend(row: SessionRow, track?: TrackRow | null) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    location: row.location ?? undefined,
    track: track?.name ?? undefined,
    trackColor: track?.color ?? undefined,
    trackId: row.trackId ?? undefined,
    speakerIds: (row.speakerIds as string[]) ?? [],
    capacity: row.capacity ?? undefined,
    isBreak: row.isBreak,
    type: row.type,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// --- Track resolver ---
async function resolveTrack(eventId: string, trackName?: string, trackColor?: string): Promise<string | null> {
  if (!trackName) return null;
  const [existing] = await db.select().from(tracks)
    .where(and(eq(tracks.eventId, eventId), eq(tracks.name, trackName))).limit(1);
  if (existing) {
    if (trackColor && trackColor !== existing.color) {
      await db.update(tracks).set({ color: trackColor, updatedAt: new Date() }).where(eq(tracks.id, existing.id));
    }
    return existing.id;
  }
  const [created] = await db.insert(tracks).values({ eventId, name: trackName, color: trackColor ?? null }).returning();
  return created.id;
}

// --- Input schemas ---
const speakerInputSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  organization: z.string().optional(),
  bio: z.string().optional(),
  imageUrl: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  linkedInUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  categories: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().int().optional(),
});

function speakerInputToDb(data: z.infer<typeof speakerInputSchema>) {
  return {
    name: data.name,
    title: data.role,
    organization: data.organization,
    bio: data.bio,
    photoUrl: data.imageUrl,
    email: data.email || null,
    socials: { linkedin: data.linkedInUrl, twitter: data.twitterUrl, website: data.websiteUrl },
    categories: data.categories ?? [],
    isFeatured: data.isFeatured,
    order: data.order,
  };
}

const sessionInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  track: z.string().optional(),
  trackColor: z.string().optional(),
  trackId: z.string().uuid().optional().nullable(),
  speakerIds: z.array(z.string()).optional(),
  capacity: z.number().int().positive().optional(),
  isBreak: z.boolean().optional(),
  type: z.enum(['talk', 'workshop', 'panel', 'break', 'keynote', 'custom']).optional(),
  order: z.number().int().optional(),
});

const trackSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

// --- Speakers ---

export async function getSpeakers(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(speakers)
    .where(eq(speakers.eventId, req.params.eventId))
    .orderBy(asc(speakers.order), asc(speakers.createdAt));
  sendSuccess(res, rows.map(speakerToFrontend));
}

export async function getSpeaker(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [row] = await db.select().from(speakers)
    .where(and(eq(speakers.id, req.params.id), eq(speakers.eventId, req.params.eventId))).limit(1);
  if (!row) { sendError(res, 'Speaker not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, speakerToFrontend(row));
}

export async function createSpeaker(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = speakerInputSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const [row] = await db.insert(speakers).values({ eventId: req.params.eventId, ...speakerInputToDb(parsed.data) }).returning();
  sendSuccess(res, speakerToFrontend(row), 'Speaker created', 201);
}

export async function updateSpeaker(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = speakerInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const dbData = speakerInputToDb({ name: '', ...parsed.data });
  const updateData = Object.fromEntries(Object.entries(dbData).filter(([, v]) => v !== undefined));
  const [row] = await db.update(speakers)
    .set({ ...updateData, updatedAt: new Date() })
    .where(and(eq(speakers.id, req.params.id), eq(speakers.eventId, req.params.eventId)))
    .returning();
  if (!row) { sendError(res, 'Speaker not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, speakerToFrontend(row));
}

export async function deleteSpeaker(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [row] = await db.delete(speakers)
    .where(and(eq(speakers.id, req.params.id), eq(speakers.eventId, req.params.eventId)))
    .returning({ id: speakers.id });
  if (!row) { sendError(res, 'Speaker not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, { id: row.id });
}

export async function reorderSpeakers(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = z.object({ order: z.array(z.string().uuid()) }).safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Provide order array of speaker IDs', 400, 'VALIDATION_ERROR'); return; }
  await Promise.all(
    parsed.data.order.map((id, index) =>
      db.update(speakers).set({ order: index, updatedAt: new Date() })
        .where(and(eq(speakers.id, id), eq(speakers.eventId, req.params.eventId)))
    )
  );
  sendSuccess(res, { reordered: parsed.data.order.length });
}

// --- Sessions ---

async function fetchSessionsWithTrack(eventId: string, date?: string) {
  const rows = await db
    .select({ session: sessions, track: tracks })
    .from(sessions)
    .leftJoin(tracks, eq(sessions.trackId, tracks.id))
    .where(date ? and(eq(sessions.eventId, eventId), eq(sessions.date, date)) : eq(sessions.eventId, eventId))
    .orderBy(asc(sessions.date), asc(sessions.startTime), asc(sessions.order));
  return rows.map(r => sessionToFrontend(r.session, r.track));
}

export async function getSessions(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const date = (req.query.date as string) || undefined;
  sendSuccess(res, await fetchSessionsWithTrack(req.params.eventId, date));
}

export async function getSession(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db
    .select({ session: sessions, track: tracks })
    .from(sessions)
    .leftJoin(tracks, eq(sessions.trackId, tracks.id))
    .where(and(eq(sessions.id, req.params.id), eq(sessions.eventId, req.params.eventId)))
    .limit(1);
  if (!rows[0]) { sendError(res, 'Session not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, sessionToFrontend(rows[0].session, rows[0].track));
}

export async function createSession(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = sessionInputSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const d = parsed.data;
  const trackId = d.trackId ?? await resolveTrack(req.params.eventId, d.track, d.trackColor);
  const [row] = await db.insert(sessions).values({
    eventId: req.params.eventId,
    trackId,
    title: d.title,
    description: d.description,
    type: d.type ?? 'talk',
    startTime: d.startTime,
    endTime: d.endTime,
    date: d.date,
    location: d.location,
    speakerIds: d.speakerIds ?? [],
    capacity: d.capacity ?? null,
    isBreak: d.isBreak ?? false,
    order: d.order ?? 0,
  }).returning();
  const trackRow = row.trackId ? (await db.select().from(tracks).where(eq(tracks.id, row.trackId)).limit(1))[0] ?? null : null;
  sendSuccess(res, sessionToFrontend(row, trackRow), 'Session created', 201);
}

export async function updateSession(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = sessionInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const d = parsed.data;
  let resolvedTrackId: string | null | undefined;
  if (d.track !== undefined) {
    resolvedTrackId = await resolveTrack(req.params.eventId, d.track, d.trackColor);
  } else if (d.trackId !== undefined) {
    resolvedTrackId = d.trackId;
  }

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (d.title !== undefined) updateFields.title = d.title;
  if (d.description !== undefined) updateFields.description = d.description;
  if (d.type !== undefined) updateFields.type = d.type;
  if (d.startTime !== undefined) updateFields.startTime = d.startTime;
  if (d.endTime !== undefined) updateFields.endTime = d.endTime;
  if (d.date !== undefined) updateFields.date = d.date;
  if (d.location !== undefined) updateFields.location = d.location;
  if (d.speakerIds !== undefined) updateFields.speakerIds = d.speakerIds;
  if (d.capacity !== undefined) updateFields.capacity = d.capacity;
  if (d.isBreak !== undefined) updateFields.isBreak = d.isBreak;
  if (d.order !== undefined) updateFields.order = d.order;
  if (resolvedTrackId !== undefined) updateFields.trackId = resolvedTrackId;

  const [row] = await db.update(sessions)
    .set(updateFields)
    .where(and(eq(sessions.id, req.params.id), eq(sessions.eventId, req.params.eventId)))
    .returning();
  if (!row) { sendError(res, 'Session not found', 404, 'NOT_FOUND'); return; }
  const trackRow = row.trackId ? (await db.select().from(tracks).where(eq(tracks.id, row.trackId)).limit(1))[0] ?? null : null;
  sendSuccess(res, sessionToFrontend(row, trackRow));
}

export async function deleteSession(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [row] = await db.delete(sessions)
    .where(and(eq(sessions.id, req.params.id), eq(sessions.eventId, req.params.eventId)))
    .returning({ id: sessions.id });
  if (!row) { sendError(res, 'Session not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, { id: row.id });
}

export async function reorderSessions(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = z.object({ order: z.array(z.string().uuid()) }).safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Provide order array of session IDs', 400, 'VALIDATION_ERROR'); return; }
  await Promise.all(
    parsed.data.order.map((id, index) =>
      db.update(sessions).set({ order: index, updatedAt: new Date() })
        .where(and(eq(sessions.id, id), eq(sessions.eventId, req.params.eventId)))
    )
  );
  sendSuccess(res, { reordered: parsed.data.order.length });
}

export async function getSchedule(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const all = await fetchSessionsWithTrack(req.params.eventId);
  const grouped: Record<string, ReturnType<typeof sessionToFrontend>[]> = {};
  for (const s of all) { if (!grouped[s.date]) grouped[s.date] = []; grouped[s.date].push(s); }
  sendSuccess(res, grouped);
}

// --- Tracks ---

export async function getTracks(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(tracks)
    .where(eq(tracks.eventId, req.params.eventId))
    .orderBy(asc(tracks.order), asc(tracks.createdAt));
  sendSuccess(res, rows);
}

export async function createTrack(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = trackSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const [row] = await db.insert(tracks).values({ eventId: req.params.eventId, ...parsed.data }).returning();
  sendSuccess(res, row, 'Track created', 201);
}

export async function updateTrack(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = trackSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const [row] = await db.update(tracks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(tracks.id, req.params.id), eq(tracks.eventId, req.params.eventId)))
    .returning();
  if (!row) { sendError(res, 'Track not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}

export async function deleteTrack(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [row] = await db.delete(tracks)
    .where(and(eq(tracks.id, req.params.id), eq(tracks.eventId, req.params.eventId)))
    .returning({ id: tracks.id });
  if (!row) { sendError(res, 'Track not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, { id: row.id });
}

// --- Public endpoints (no auth required) ---

export async function getPublicSpeakers(req: Request, res: Response) {
  if (!(await assertEventExists(req.params.eventId, res))) return;
  const rows = await db.select().from(speakers)
    .where(eq(speakers.eventId, req.params.eventId))
    .orderBy(asc(speakers.order), asc(speakers.createdAt));
  sendSuccess(res, rows.map(speakerToFrontend));
}

export async function getPublicSchedule(req: Request, res: Response) {
  if (!(await assertEventExists(req.params.eventId, res))) return;
  const all = await fetchSessionsWithTrack(req.params.eventId);
  const grouped: Record<string, ReturnType<typeof sessionToFrontend>[]> = {};
  for (const s of all) { if (!grouped[s.date]) grouped[s.date] = []; grouped[s.date].push(s); }
  sendSuccess(res, grouped);
}
