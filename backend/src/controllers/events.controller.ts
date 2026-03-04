import { Request, Response } from 'express';
import { eq, and, desc, ilike, sql, sum } from 'drizzle-orm';
import { db } from '../db';
import { events } from '../db/schema';
import { tickets, attendees } from '../db/schema';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';
import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────
function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

/** UUID v4 regex */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (true) {
    const rows = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
    if (rows.length === 0 || (excludeId && rows[0].id === excludeId)) break;
    slug = `${base}-${counter++}`;
  }
  return slug;
}

const createEventSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Physical', 'Virtual', 'Hybrid']).default('Physical'),
  description: z.string().optional().default(''),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string().optional().default(''),
  endTime: z.string().optional().default(''),
  subdomain: z.string().optional().default(''),
  customDomain: z.string().optional().default(''),
  coverImageUrl: z.string().optional().default(''),
  country: z.string().optional().default(''),
  venueLocation: z.string().optional().default(''),
  categories: z.array(z.string()).optional().default([]),
  currency: z.string().optional().default('NGN'),
  isRecurring: z.boolean().optional().default(false),
  recurringConfig: z.any().optional(),
});

// ─── GET /events ──────────────────────────────────────────
export async function getEvents(req: Request, res: Response) {
  const userId = req.user!.sub;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
  const search = (req.query.search as string) || '';
  const offset = (page - 1) * limit;

  const conditions = [eq(events.ownerId, userId)];
  if (search) conditions.push(ilike(events.name, `%${search}%`));

  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(and(...conditions));

  const rows = await db.select().from(events)
    .where(and(...conditions))
    .orderBy(desc(events.createdAt))
    .limit(limit)
    .offset(offset);

  sendPaginated(res, rows, total.count, page, limit);
}

// ─── GET /events/:id ──────────────────────────────────────
export async function getEvent(req: Request, res: Response) {
  const userId = req.user!.sub;
  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }
  const [event] = await db.select().from(events)
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId))).limit(1);

  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, event);
}

// ─── GET /events/slug/:slug ───────────────────────────────
export async function getEventBySlug(req: Request, res: Response) {
  const [event] = await db.select().from(events).where(eq(events.slug, req.params.slug)).limit(1);
  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, event);
}

// ─── POST /events ─────────────────────────────────────────
export async function createEvent(req: Request, res: Response) {
  const userId = req.user!.sub;
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  const { name, type, description, startDate, startTime, endDate, endTime,
    subdomain, customDomain, coverImageUrl, country, venueLocation, categories,
    currency, isRecurring, recurringConfig } = parsed.data;

  // Convert empty strings to null for unique-constrained columns
  const safeSubdomain = subdomain || null;
  const safeCustomDomain = customDomain || null;

  const baseSlug = slugify(name);
  const slug = await uniqueSlug(baseSlug);
  const websiteUrl = safeSubdomain
    ? `https://${safeSubdomain}.munar.app`
    : `https://munar.app/e/${slug}`;

  try {
    const [event] = await db.insert(events).values({
      ownerId: userId,
      name,
      slug,
      description,
      startDate,
      startTime,
      endDate: endDate || null,
      endTime: endTime || null,
      coverImageUrl: coverImageUrl || null,
      country: country || null,
      venueLocation: venueLocation || null,
      type,
      categories: categories ?? [],
      currency: currency ?? 'NGN',
      isRecurring: isRecurring ?? false,
      recurringConfig,
      subdomain: safeSubdomain,
      customDomain: safeCustomDomain,
      websiteUrl,
      status: 'draft',
      phase: 'setup',
    }).returning();

    sendSuccess(res, event, 'Event created', 201);
  } catch (err: any) {
    if (err?.code === '23505') {
      // Unique constraint violation
      const detail: string = err.detail ?? '';
      if (detail.includes('subdomain')) {
        sendError(res, 'This subdomain is already taken', 409, 'SUBDOMAIN_TAKEN');
      } else if (detail.includes('slug')) {
        sendError(res, 'An event with this name already exists', 409, 'SLUG_CONFLICT');
      } else {
        sendError(res, 'A unique constraint was violated', 409, 'CONFLICT');
      }
    } else {
      console.error('createEvent DB error:', err);
      sendError(res, 'Failed to create event', 500, 'DB_ERROR');
    }
  }
}

// ─── PUT /events/:id ──────────────────────────────────────
export async function updateEvent(req: Request, res: Response) {
  const userId = req.user!.sub;
  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }
  const [existing] = await db.select({ id: events.id, slug: events.slug }).from(events)
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId))).limit(1);

  if (!existing) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  const updateSchema = createEventSchema.partial().extend({
    status: z.enum(['draft', 'published', 'unpublished']).optional(),
    phase: z.enum(['setup', 'live', 'post-event']).optional(),
    branding: z.any().optional(),
    enabledModules: z.any().optional(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  let slug = existing.slug;
  if (parsed.data.name) {
    slug = await uniqueSlug(slugify(parsed.data.name), existing.id);
  }

  // Normalize empty strings to null for unique-constrained columns
  const updateData = { ...parsed.data };
  if ('subdomain' in updateData) updateData.subdomain = updateData.subdomain || undefined;
  if ('customDomain' in updateData) updateData.customDomain = updateData.customDomain || undefined;

  try {
    const [updated] = await db.update(events)
      .set({ ...updateData, slug, updatedAt: new Date() })
      .where(eq(events.id, existing.id))
      .returning();

    sendSuccess(res, updated);
  } catch (err: any) {
    if (err?.code === '23505') {
      const detail: string = err.detail ?? '';
      if (detail.includes('subdomain')) {
        sendError(res, 'This subdomain is already taken', 409, 'SUBDOMAIN_TAKEN');
      } else {
        sendError(res, 'A unique constraint was violated', 409, 'CONFLICT');
      }
    } else {
      console.error('updateEvent DB error:', err);
      sendError(res, 'Failed to update event', 500, 'DB_ERROR');
    }
  }
}

// ─── DELETE /events/:id ───────────────────────────────────
export async function deleteEvent(req: Request, res: Response) {
  const userId = req.user!.sub;
  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }
  const [existing] = await db.select({ id: events.id }).from(events)
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId))).limit(1);

  if (!existing) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  await db.delete(events).where(eq(events.id, existing.id));
  sendSuccess(res, { id: existing.id }, 'Event deleted');
}

// ─── PATCH /events/:id/publish ────────────────────────────
export async function publishEvent(req: Request, res: Response) {
  const userId = req.user!.sub;  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }  const [updated] = await db.update(events)
    .set({ status: 'published', updatedAt: new Date() })
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId)))
    .returning();

  if (!updated) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, updated, 'Event published');
}

// ─── PATCH /events/:id/unpublish ─────────────────────────
export async function unpublishEvent(req: Request, res: Response) {
  const userId = req.user!.sub;  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }  const [updated] = await db.update(events)
    .set({ status: 'unpublished', updatedAt: new Date() })
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId)))
    .returning();

  if (!updated) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, updated, 'Event unpublished');
}

// ─── Default modules list ─────────────────────────────────
function defaultModuleList() {
  return [
    { id: 'mod1', name: 'Event Website', description: 'Customize your landing page', icon: 'globe', status: 'not-started', actionLabel: 'Customize', iconColor: 'green' },
    { id: 'mod2', name: 'Tickets', description: 'Create and manage ticket tiers', icon: 'ticket', status: 'not-started', actionLabel: 'Set up', iconColor: 'orange' },
    { id: 'mod3', name: 'Schedule & Agenda', description: 'Manage sessions and timeline', icon: 'calendar', status: 'not-started', actionLabel: 'Set up', iconColor: 'pink' },
    { id: 'mod4', name: 'People & Speakers', description: 'Speaker profiles and Bios', icon: 'mic', status: 'not-started', actionLabel: 'Set up', iconColor: 'green' },
    { id: 'mod5', name: 'Sponsors', description: 'Create and manage brand partners', icon: 'users', status: 'not-started', actionLabel: 'Set up', iconColor: 'blue' },
    { id: 'mod6', name: 'Forms and surveys', description: 'Collect attendee data and feedback', icon: 'file-text', status: 'not-started', actionLabel: 'Set up', iconColor: 'pink' },
    { id: 'mod7', name: 'Voting', description: 'Setup live polls and awards', icon: 'vote', status: 'not-started', actionLabel: 'Set up', iconColor: 'indigo' },
    { id: 'mod8', name: 'Event Media & Gallery', description: 'Upload and publish gallery', icon: 'globe', status: 'not-started', actionLabel: 'Set up', iconColor: 'purple' },
    { id: 'mod9', name: 'DP & Cover Maker', description: 'Create branded social images', icon: 'image', status: 'not-started', actionLabel: 'Set up', iconColor: 'purple' },
    { id: 'mod10', name: 'Merchandise', description: 'Sell items and add-ons', icon: 'shopping-bag', status: 'not-started', actionLabel: 'Set up', iconColor: 'gray' },
    { id: 'mod11', name: 'Analytics', description: 'Overview of your event analytics', icon: 'layout', status: 'active', actionLabel: 'View', iconColor: 'indigo' },
  ];
}

// ─── GET /events/:id/modules ──────────────────────────────
export async function getEventModules(req: Request, res: Response) {
  const userId = req.user!.sub;
  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }

  // Verify ownership
  const [event] = await db.select({ id: events.id, enabledModules: events.enabledModules })
    .from(events)
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId)))
    .limit(1);

  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  // Count tickets to mark Tickets module as active
  const [ticketCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(eq(tickets.eventId, req.params.id));

  const modules = defaultModuleList().map(m => {
    if (m.name === 'Tickets' && ticketCount.count > 0) {
      return { ...m, status: 'active', count: ticketCount.count };
    }
    return m;
  });

  sendSuccess(res, modules);
}

// ─── GET /events/:id/checklist ────────────────────────────
export async function getEventChecklist(req: Request, res: Response) {
  const userId = req.user!.sub;
  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }

  const [event] = await db.select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId)))
    .limit(1);

  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  // Count tickets for checklist status
  const [ticketCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(eq(tickets.eventId, req.params.id));

  const checklistConfig = [
    { id: 'tickets', label: 'Add tickets or registration', module: 'Tickets', actionLabel: 'Set up', hasData: ticketCount.count > 0 },
    { id: 'website', label: 'Customize event website', module: 'Event Website', actionLabel: 'Customize', hasData: false },
    { id: 'schedule', label: 'Add schedule and speakers', module: 'Schedule & Agenda', actionLabel: 'Set up', hasData: false },
    { id: 'sponsors', label: 'Add sponsors', module: 'Sponsors', actionLabel: 'Set up', hasData: false },
    { id: 'forms', label: 'Create forms and surveys', module: 'Forms and surveys', actionLabel: 'Set up', hasData: false },
    { id: 'gallery', label: 'Upload event media', module: 'Event Media & Gallery', actionLabel: 'Set up', hasData: false },
    { id: 'dp', label: 'Create DP & cover maker', module: 'DP & Cover Maker', actionLabel: 'Set up', hasData: false },
    { id: 'merch', label: 'Add merchandise', module: 'Merchandise', actionLabel: 'Set up', hasData: false },
    { id: 'voting', label: 'Enable voting', module: 'Voting', actionLabel: 'Set up', hasData: false },
  ];

  const items = checklistConfig.map(item => ({
    id: item.id,
    label: item.label,
    status: item.hasData ? 'completed' : 'not-started',
    actionLabel: item.actionLabel,
    phase: 'setup',
    count: 0,
  }));

  const notCompleted = items.filter(i => i.status !== 'completed');
  const completed = items.filter(i => i.status === 'completed');
  sendSuccess(res, [...notCompleted, ...completed]);
}

// ─── GET /events/:id/metrics ──────────────────────────────
export async function getEventMetrics(req: Request, res: Response) {
  const userId = req.user!.sub;
  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }

  const [event] = await db.select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId)))
    .limit(1);

  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  // Query real ticket/attendee counts
  const [ticketStats] = await db
    .select({
      totalTickets: sql<number>`count(*)::int`,
      totalCapacity: sql<number>`coalesce(sum(quantity_total), 0)::int`,
      totalSold: sql<number>`coalesce(sum(quantity_sold), 0)::int`,
    })
    .from(tickets)
    .where(eq(tickets.eventId, req.params.id));

  const [checkinCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attendees)
    .where(and(eq(attendees.eventId, req.params.id), eq(attendees.status, 'checked-in')));

  const [registrationCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attendees)
    .where(eq(attendees.eventId, req.params.id));

  const metrics = [
    {
      id: 'm1',
      label: 'Registrations',
      value: registrationCount.count > 0
        ? `${registrationCount.count}/${ticketStats.totalCapacity}`
        : ticketStats.totalTickets > 0 ? `0/${ticketStats.totalCapacity}` : 'No tickets yet',
      context: 'setup',
    },
    {
      id: 'm2',
      label: 'Website Views',
      value: '0',
      context: 'setup',
    },
    {
      id: 'm3',
      label: 'Tickets Sold',
      value: ticketStats.totalSold,
      context: 'setup',
    },
    {
      id: 'm4',
      label: 'Total Revenue',
      value: '₦0',
      context: 'setup',
    },
    {
      id: 'm5',
      label: 'Check-ins',
      value: checkinCount.count,
      context: 'setup',
    },
    {
      id: 'm6',
      label: 'Survey Responses',
      value: '0',
      context: 'setup',
    },
  ];

  sendSuccess(res, metrics);
}

// ─── GET /events/:id/activities ───────────────────────────
export async function getEventActivities(req: Request, res: Response) {
  const userId = req.user!.sub;
  if (!isUuid(req.params.id)) { sendError(res, 'Invalid event ID', 400, 'INVALID_ID'); return; }

  const [event] = await db.select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, req.params.id), eq(events.ownerId, userId)))
    .limit(1);

  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  // No activities table yet — return empty array
  sendSuccess(res, []);
}
