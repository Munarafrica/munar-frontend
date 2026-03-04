import { Request, Response } from 'express';
import { eq, and, sql, desc, asc, ilike, or, count } from 'drizzle-orm';
import { db } from '../db';
import { tickets, attendees, events, ticketOrders, ticketQuestions, ticketSettings } from '../db/schema';
import { sendSuccess, sendError, sendPaginated } from '../lib/response';
import { sendTicketConfirmationEmail } from '../lib/email';
import { z } from 'zod';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// ─── Helpers ──────────────────────────────────────────────

async function assertEventOwner(eventId: string, userId: string, res: Response): Promise<boolean> {
  const [ev] = await db.select({ id: events.id }).from(events)
    .where(and(eq(events.id, eventId), eq(events.ownerId, userId))).limit(1);
  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return false; }
  return true;
}

function generateOrderRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'MNR-';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function generateQR(data: string): Promise<string> {
  return QRCode.toDataURL(data, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
}

// ─── Validation Schemas ───────────────────────────────────

const ticketSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Single', 'Group']).default('Single'),
  groupSize: z.number().optional(),
  isFree: z.boolean().default(false),
  price: z.number().optional(),
  quantityTotal: z.number().int().positive(),
  salesStart: z.string(),
  salesEnd: z.string(),
  minPerOrder: z.number().int().default(1),
  maxPerOrder: z.number().int().default(10),
  visibility: z.enum(['Public', 'Hidden', 'Invite Only']).default('Public'),
  description: z.string().optional(),
  perks: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  allowTransfer: z.boolean().default(false),
  allowResale: z.boolean().default(false),
  refundPolicy: z.enum(['Refundable', 'Non-refundable']).default('Non-refundable'),
  requireAttendeeInfo: z.boolean().default(false),
  color: z.string().optional(),
  status: z.enum(['Draft', 'On Sale', 'Sold Out', 'Hidden']).optional(),
  sortOrder: z.number().int().optional(),
});

const questionSchema = z.object({
  label: z.string().min(1),
  type: z.enum(['text', 'dropdown', 'checkbox']).default('text'),
  required: z.boolean().default(false),
  ticketIds: z.array(z.string()).default(['all']),
  options: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const settingsSchema = z.object({
  enableTransfers: z.boolean().default(true),
  enableResale: z.boolean().default(false),
  resaleCap: z.number().int().optional(),
  refundPolicy: z.string().default('flexible'),
  supportEmail: z.string().optional(),
});

const checkoutSchema = z.object({
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().optional(),
  items: z.array(z.object({
    ticketId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  attendees: z.array(z.object({
    ticketId: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  })).optional(),
  questionAnswers: z.array(z.object({
    questionId: z.string(),
    questionLabel: z.string(),
    answer: z.string(),
  })).optional(),
});

// ══════════════════════════════════════════════════════════
//  TICKET CRUD (Authenticated)
// ══════════════════════════════════════════════════════════

// GET /events/:eventId/tickets
export async function getTickets(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(tickets)
    .where(eq(tickets.eventId, req.params.eventId))
    .orderBy(asc(tickets.sortOrder), asc(tickets.createdAt));
  sendSuccess(res, rows);
}

// GET /events/:eventId/tickets/:id
export async function getTicket(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [ticket] = await db.select().from(tickets)
    .where(and(eq(tickets.id, req.params.id), eq(tickets.eventId, req.params.eventId))).limit(1);
  if (!ticket) { sendError(res, 'Ticket not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, ticket);
}

// POST /events/:eventId/tickets
export async function createTicket(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = ticketSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const { price, status, ...rest } = parsed.data;
  
  // Auto-assign sort order
  const existing = await db.select({ count: sql<number>`count(*)` }).from(tickets)
    .where(eq(tickets.eventId, req.params.eventId));
  const sortOrder = (existing[0]?.count || 0) as number;

  const [ticket] = await db.insert(tickets).values({
    eventId: req.params.eventId,
    ...rest,
    price: price?.toString(),
    status: status || 'On Sale',
    sortOrder,
  }).returning();
  sendSuccess(res, ticket, 'Ticket created', 201);
}

// PUT|PATCH /events/:eventId/tickets/:id
export async function updateTicket(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = ticketSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const { price: priceNum, ...restData } = parsed.data;
  const data = { ...restData, ...(priceNum !== undefined ? { price: priceNum.toString() } : {}), updatedAt: new Date() };
  const [updated] = await db.update(tickets).set(data)
    .where(and(eq(tickets.id, req.params.id), eq(tickets.eventId, req.params.eventId)))
    .returning();
  if (!updated) { sendError(res, 'Ticket not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, updated);
}

// DELETE /events/:eventId/tickets/:id
export async function deleteTicket(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  
  // Prevent deleting tickets that have been sold
  const [ticket] = await db.select().from(tickets)
    .where(and(eq(tickets.id, req.params.id), eq(tickets.eventId, req.params.eventId))).limit(1);
  if (!ticket) { sendError(res, 'Ticket not found', 404, 'NOT_FOUND'); return; }
  if (ticket.quantitySold > 0) {
    sendError(res, 'Cannot delete a ticket that has sales. Disable it instead.', 400, 'HAS_SALES');
    return;
  }
  
  await db.delete(tickets).where(eq(tickets.id, req.params.id));
  sendSuccess(res, { id: req.params.id }, 'Ticket deleted');
}

// POST /events/:eventId/tickets/:id/duplicate
export async function duplicateTicket(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [original] = await db.select().from(tickets)
    .where(and(eq(tickets.id, req.params.id), eq(tickets.eventId, req.params.eventId))).limit(1);
  if (!original) { sendError(res, 'Ticket not found', 404, 'NOT_FOUND'); return; }

  const { id, createdAt, updatedAt, quantitySold, ...rest } = original;
  const [duplicated] = await db.insert(tickets).values({
    ...rest,
    name: `${original.name} (Copy)`,
    status: 'Draft',
    quantitySold: 0,
  }).returning();
  sendSuccess(res, duplicated, 'Ticket duplicated', 201);
}

// PATCH /events/:eventId/tickets/reorder
export async function reorderTickets(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const { order } = req.body as { order: string[] }; // array of ticket IDs in new order
  if (!order?.length) { sendError(res, 'Order array is required', 400, 'VALIDATION_ERROR'); return; }

  await Promise.all(order.map((id: string, idx: number) =>
    db.update(tickets).set({ sortOrder: idx, updatedAt: new Date() })
      .where(and(eq(tickets.id, id), eq(tickets.eventId, req.params.eventId)))
  ));
  sendSuccess(res, { reordered: order.length }, 'Tickets reordered');
}

// GET /events/:eventId/tickets/analytics
export async function getTicketAnalytics(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  
  const ticketRows = await db.select().from(tickets).where(eq(tickets.eventId, req.params.eventId));
  
  const totalSold = ticketRows.reduce((s, t) => s + t.quantitySold, 0);
  const totalAvailable = ticketRows.reduce((s, t) => s + t.quantityTotal, 0);
  const totalRevenue = ticketRows.reduce((s, t) => s + (parseFloat(t.price || '0') * t.quantitySold), 0);

  // Attendee count
  const [attendeeCount] = await db.select({ count: sql<number>`count(*)` })
    .from(attendees).where(eq(attendees.eventId, req.params.eventId));
  const [checkedInCount] = await db.select({ count: sql<number>`count(*)` })
    .from(attendees).where(and(eq(attendees.eventId, req.params.eventId), eq(attendees.status, 'checked-in')));

  sendSuccess(res, {
    totalRevenue,
    totalSold,
    totalAvailable,
    totalAttendees: attendeeCount?.count || 0,
    totalCheckedIn: checkedInCount?.count || 0,
    salesByTicketType: ticketRows.map(t => ({
      ticketId: t.id,
      ticketName: t.name,
      sold: t.quantitySold,
      total: t.quantityTotal,
      revenue: parseFloat(t.price || '0') * t.quantitySold,
    })),
  });
}

// ══════════════════════════════════════════════════════════
//  ATTENDEES (Authenticated)
// ══════════════════════════════════════════════════════════

// GET /events/:eventId/attendees
export async function getAttendees(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const { search, ticketId: filterTicketId, status: filterStatus, page: pageStr, limit: limitStr } = req.query as Record<string, string>;
  const page = parseInt(pageStr) || 1;
  const limit = Math.min(parseInt(limitStr) || 50, 200);
  const offset = (page - 1) * limit;

  // Build where conditions
  let conditions = eq(attendees.eventId, req.params.eventId);

  // Join with tickets to get ticket name
  const rows = await db.select({
    id: attendees.id,
    eventId: attendees.eventId,
    ticketId: attendees.ticketId,
    ticketName: tickets.name,
    orderId: attendees.orderId,
    name: attendees.name,
    email: attendees.email,
    phone: attendees.phone,
    orderReference: attendees.orderReference,
    qrCode: attendees.qrCode,
    status: attendees.status,
    checkedInAt: attendees.checkedInAt,
    metadata: attendees.metadata,
    createdAt: attendees.createdAt,
    updatedAt: attendees.updatedAt,
  })
    .from(attendees)
    .leftJoin(tickets, eq(attendees.ticketId, tickets.id))
    .where(
      and(
        eq(attendees.eventId, req.params.eventId),
        search ? or(
          ilike(attendees.name, `%${search}%`),
          ilike(attendees.email, `%${search}%`),
          ilike(attendees.orderReference, `%${search}%`)
        ) : undefined,
        filterTicketId ? eq(attendees.ticketId, filterTicketId) : undefined,
        filterStatus === 'checked-in' ? eq(attendees.status, 'checked-in') :
        filterStatus === 'registered' ? eq(attendees.status, 'registered') :
        filterStatus === 'cancelled' ? eq(attendees.status, 'cancelled') : undefined,
      )
    )
    .orderBy(desc(attendees.createdAt))
    .limit(limit)
    .offset(offset);

  // Total count for pagination
  const [total] = await db.select({ count: sql<number>`count(*)` })
    .from(attendees)
    .where(eq(attendees.eventId, req.params.eventId));

  sendPaginated(res, rows, total?.count || 0, page, limit);
}

// PATCH /events/:eventId/attendees/:id/check-in
export async function checkInAttendee(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [updated] = await db.update(attendees)
    .set({ status: 'checked-in', checkedInAt: new Date(), updatedAt: new Date() })
    .where(and(eq(attendees.id, req.params.id), eq(attendees.eventId, req.params.eventId)))
    .returning();
  if (!updated) { sendError(res, 'Attendee not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, updated, 'Attendee checked in');
}

// PATCH /events/:eventId/attendees/:id/undo-check-in
export async function undoCheckIn(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [updated] = await db.update(attendees)
    .set({ status: 'registered', checkedInAt: null, updatedAt: new Date() })
    .where(and(eq(attendees.id, req.params.id), eq(attendees.eventId, req.params.eventId)))
    .returning();
  if (!updated) { sendError(res, 'Attendee not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, updated, 'Check-in undone');
}

// GET /events/:eventId/attendees/export
export async function exportAttendees(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const rows = await db.select({
    name: attendees.name,
    email: attendees.email,
    phone: attendees.phone,
    ticketName: tickets.name,
    orderReference: attendees.orderReference,
    status: attendees.status,
    checkedInAt: attendees.checkedInAt,
    createdAt: attendees.createdAt,
  })
    .from(attendees)
    .leftJoin(tickets, eq(attendees.ticketId, tickets.id))
    .where(eq(attendees.eventId, req.params.eventId))
    .orderBy(desc(attendees.createdAt));

  const format = (req.query.format as string) || 'csv';
  
  if (format === 'xlsx') {
    // Use xlsx package
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      Name: r.name,
      Email: r.email,
      Phone: r.phone || '',
      'Ticket Type': r.ticketName || '',
      'Order Ref': r.orderReference,
      Status: r.status,
      'Checked In At': r.checkedInAt ? new Date(r.checkedInAt).toISOString() : '',
      'Registered At': r.createdAt ? new Date(r.createdAt).toISOString() : '',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=attendees.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } else {
    // CSV
    const header = 'Name,Email,Phone,Ticket Type,Order Ref,Status,Checked In At,Registered At\n';
    const csvRows = rows.map(r =>
      `"${r.name}","${r.email}","${r.phone || ''}","${r.ticketName || ''}","${r.orderReference}","${r.status}","${r.checkedInAt || ''}","${r.createdAt || ''}"`
    ).join('\n');
    res.setHeader('Content-Disposition', 'attachment; filename=attendees.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(header + csvRows);
  }
}

// ══════════════════════════════════════════════════════════
//  ORDERS (Authenticated)
// ══════════════════════════════════════════════════════════

// GET /events/:eventId/orders
export async function getOrders(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(ticketOrders)
    .where(eq(ticketOrders.eventId, req.params.eventId))
    .orderBy(desc(ticketOrders.createdAt));
  sendSuccess(res, rows);
}

// ══════════════════════════════════════════════════════════
//  CHECKOUT QUESTIONS (Authenticated CRUD)
// ══════════════════════════════════════════════════════════

// GET /events/:eventId/ticket-questions
export async function getQuestions(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const rows = await db.select().from(ticketQuestions)
    .where(eq(ticketQuestions.eventId, req.params.eventId))
    .orderBy(asc(ticketQuestions.sortOrder));
  sendSuccess(res, rows);
}

// POST /events/:eventId/ticket-questions
export async function createQuestion(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const [question] = await db.insert(ticketQuestions).values({
    eventId: req.params.eventId,
    ...parsed.data,
  }).returning();
  sendSuccess(res, question, 'Question created', 201);
}

// PUT /events/:eventId/ticket-questions/:id
export async function updateQuestion(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = questionSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }
  const [updated] = await db.update(ticketQuestions).set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(ticketQuestions.id, req.params.id), eq(ticketQuestions.eventId, req.params.eventId)))
    .returning();
  if (!updated) { sendError(res, 'Question not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, updated);
}

// DELETE /events/:eventId/ticket-questions/:id
export async function deleteQuestion(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  await db.delete(ticketQuestions)
    .where(and(eq(ticketQuestions.id, req.params.id), eq(ticketQuestions.eventId, req.params.eventId)));
  sendSuccess(res, { id: req.params.id }, 'Question deleted');
}

// ══════════════════════════════════════════════════════════
//  TICKET SETTINGS (Authenticated)
// ══════════════════════════════════════════════════════════

// GET /events/:eventId/ticket-settings
export async function getSettings(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const [settings] = await db.select().from(ticketSettings)
    .where(eq(ticketSettings.eventId, req.params.eventId)).limit(1);
  
  // Return defaults if no settings exist yet
  sendSuccess(res, settings || {
    enableTransfers: true,
    enableResale: false,
    resaleCap: 10,
    refundPolicy: 'flexible',
    supportEmail: '',
  });
}

// PUT /events/:eventId/ticket-settings
export async function updateSettings(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  // Upsert
  const [existing] = await db.select({ id: ticketSettings.id }).from(ticketSettings)
    .where(eq(ticketSettings.eventId, req.params.eventId)).limit(1);

  let result;
  if (existing) {
    [result] = await db.update(ticketSettings).set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(ticketSettings.eventId, req.params.eventId)).returning();
  } else {
    [result] = await db.insert(ticketSettings).values({
      eventId: req.params.eventId,
      ...parsed.data,
    }).returning();
  }
  sendSuccess(res, result, 'Settings saved');
}

// ══════════════════════════════════════════════════════════
//  PUBLIC ENDPOINTS (No Auth)
// ══════════════════════════════════════════════════════════

// GET /public/e/:slug/tickets - List available tickets for an event
export async function getPublicTickets(req: Request, res: Response) {
  const slug = req.params.slug;
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  // Only return public, on-sale tickets that are within their sales window
  const now = new Date().toISOString();
  const ticketRows = await db.select().from(tickets)
    .where(and(
      eq(tickets.eventId, event.id),
      eq(tickets.status, 'On Sale'),
      eq(tickets.visibility, 'Public'),
    ))
    .orderBy(asc(tickets.sortOrder));

  // Filter by sales window in app layer (text comparison of ISO dates)
  const available = ticketRows.filter(t => {
    const start = t.salesStart || '';
    const end = t.salesEnd || '';
    return (!start || start <= now) && (!end || end >= now);
  });

  // Also return checkout questions for this event
  const questions = await db.select().from(ticketQuestions)
    .where(eq(ticketQuestions.eventId, event.id))
    .orderBy(asc(ticketQuestions.sortOrder));

  sendSuccess(res, {
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      date: event.startDate,
      time: event.startTime,
      endDate: event.endDate,
      endTime: event.endTime,
      type: event.type,
      coverImageUrl: event.coverImageUrl,
      venueLocation: event.venueLocation,
      currency: event.currency,
    },
    tickets: available.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      type: t.type,
      groupSize: t.groupSize,
      isFree: t.isFree,
      price: parseFloat(t.price || '0'),
      available: t.quantityTotal - t.quantitySold,
      quantityTotal: t.quantityTotal,
      minPerOrder: t.minPerOrder,
      maxPerOrder: t.maxPerOrder,
      perks: t.perks,
      requireAttendeeInfo: t.requireAttendeeInfo,
    })),
    questions,
  });
}

// POST /public/e/:slug/tickets/checkout - Process ticket purchase
export async function publicCheckout(req: Request, res: Response) {
  const slug = req.params.slug;
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  const { buyerName, buyerEmail, buyerPhone, items, attendees: attendeeList, questionAnswers } = parsed.data;

  // Validate all ticket IDs and check availability
  const ticketIds = items.map(i => i.ticketId);
  const ticketRows = await db.select().from(tickets)
    .where(and(eq(tickets.eventId, event.id), eq(tickets.status, 'On Sale')));
  
  const ticketMap = new Map(ticketRows.map(t => [t.id, t]));
  let totalAmount = 0;
  const orderItems: Array<{ ticketId: string; ticketName: string; quantity: number; unitPrice: number }> = [];

  for (const item of items) {
    const ticket = ticketMap.get(item.ticketId);
    if (!ticket) {
      sendError(res, `Ticket ${item.ticketId} not found or not available`, 400, 'INVALID_TICKET');
      return;
    }
    const remaining = ticket.quantityTotal - ticket.quantitySold;
    if (item.quantity > remaining) {
      sendError(res, `Only ${remaining} tickets remaining for "${ticket.name}"`, 400, 'INSUFFICIENT_QUANTITY');
      return;
    }
    if (item.quantity < ticket.minPerOrder || item.quantity > ticket.maxPerOrder) {
      sendError(res, `Quantity for "${ticket.name}" must be between ${ticket.minPerOrder} and ${ticket.maxPerOrder}`, 400, 'INVALID_QUANTITY');
      return;
    }
    const unitPrice = ticket.isFree ? 0 : parseFloat(ticket.price || '0');
    totalAmount += unitPrice * item.quantity;
    orderItems.push({ ticketId: ticket.id, ticketName: ticket.name, quantity: item.quantity, unitPrice });
  }

  const orderRef = generateOrderRef();

  // Create the order
  const [order] = await db.insert(ticketOrders).values({
    eventId: event.id,
    orderReference: orderRef,
    buyerName,
    buyerEmail,
    buyerPhone,
    currency: event.currency,
    totalAmount: totalAmount.toString(),
    status: 'completed', // Mock payment - immediately completed
    paymentMethod: 'mock',
    paymentReference: `MOCK-${Date.now()}`,
    items: orderItems,
    questionAnswers: questionAnswers || [],
  }).returning();

  // Update ticket sold counts and create attendee records
  const createdAttendees = [];

  for (const item of items) {
    // Increment sold count
    await db.update(tickets).set({
      quantitySold: sql`${tickets.quantitySold} + ${item.quantity}`,
      updatedAt: new Date(),
    }).where(eq(tickets.id, item.ticketId));

    // Auto-mark as sold out if needed
    const [refreshed] = await db.select().from(tickets).where(eq(tickets.id, item.ticketId));
    if (refreshed && refreshed.quantitySold >= refreshed.quantityTotal) {
      await db.update(tickets).set({ status: 'Sold Out', updatedAt: new Date() }).where(eq(tickets.id, item.ticketId));
    }

    // Create attendee records
    const ticket = ticketMap.get(item.ticketId)!;
    
    // Check if specific attendee info was provided for this ticket
    const attendeesForTicket = attendeeList?.filter(a => a.ticketId === item.ticketId) || [];
    
    for (let i = 0; i < item.quantity; i++) {
      const attendeeInfo = attendeesForTicket[i];
      const attendeeId = uuidv4();
      const qrData = JSON.stringify({
        attendeeId,
        eventId: event.id,
        ticketId: item.ticketId,
        orderRef,
        name: attendeeInfo?.name || buyerName,
      });
      const qrCode = await generateQR(qrData);
      
      const [att] = await db.insert(attendees).values({
        id: attendeeId,
        eventId: event.id,
        ticketId: item.ticketId,
        orderId: order.id,
        name: attendeeInfo?.name || buyerName,
        email: attendeeInfo?.email || buyerEmail,
        phone: attendeeInfo?.phone || buyerPhone,
        orderReference: orderRef,
        qrCode,
        status: 'registered',
      }).returning();
      createdAttendees.push({ ...att, ticketName: ticket.name });
    }
  }

  // Send confirmation email (fire-and-forget — don't block the response)
  sendTicketConfirmationEmail(
    {
      orderReference: orderRef,
      buyerName,
      buyerEmail,
      totalAmount,
      currency: event.currency || 'NGN',
      items: orderItems,
    },
    {
      name: event.name,
      date: event.startDate || '',
      time: event.startTime || undefined,
      venueLocation: event.venueLocation || undefined,
    },
    createdAttendees.map(a => ({
      name: a.name,
      email: a.email,
      ticketName: a.ticketName,
      qrCode: a.qrCode || '',
      orderReference: a.orderReference || orderRef,
    })),
  ).catch(err => console.error('Failed to send ticket confirmation email:', err));

  sendSuccess(res, {
    order: {
      id: order.id,
      orderReference: orderRef,
      buyerName,
      buyerEmail,
      totalAmount,
      currency: event.currency,
      status: 'completed',
      items: orderItems,
    },
    attendees: createdAttendees.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      ticketName: a.ticketName,
      orderReference: a.orderReference,
      qrCode: a.qrCode,
    })),
    event: {
      name: event.name,
      date: event.startDate,
      time: event.startTime,
      venueLocation: event.venueLocation,
    },
  }, 'Order placed successfully', 201);
}

// GET /public/orders/:orderRef - Lookup order by reference
export async function getPublicOrder(req: Request, res: Response) {
  const orderRef = req.params.orderRef;
  const [order] = await db.select().from(ticketOrders)
    .where(eq(ticketOrders.orderReference, orderRef)).limit(1);
  if (!order) { sendError(res, 'Order not found', 404, 'NOT_FOUND'); return; }

  // Get associated attendees
  const attendeeRows = await db.select({
    id: attendees.id,
    name: attendees.name,
    email: attendees.email,
    ticketId: attendees.ticketId,
    ticketName: tickets.name,
    orderReference: attendees.orderReference,
    qrCode: attendees.qrCode,
    status: attendees.status,
    checkedInAt: attendees.checkedInAt,
  })
    .from(attendees)
    .leftJoin(tickets, eq(attendees.ticketId, tickets.id))
    .where(eq(attendees.orderReference, orderRef));

  // Get event info
  const [event] = await db.select().from(events).where(eq(events.id, order.eventId)).limit(1);

  sendSuccess(res, {
    order,
    attendees: attendeeRows,
    event: event ? {
      name: event.name,
      date: event.startDate,
      time: event.startTime,
      venueLocation: event.venueLocation,
      slug: event.slug,
    } : null,
  });
}

// POST /public/attendees/:id/validate - Validate a ticket by QR code data
export async function validateTicket(req: Request, res: Response) {
  const { attendeeId, eventId } = req.body as { attendeeId: string; eventId: string };
  if (!attendeeId || !eventId) {
    sendError(res, 'attendeeId and eventId are required', 400, 'VALIDATION_ERROR');
    return;
  }

  const [attendee] = await db.select({
    id: attendees.id,
    name: attendees.name,
    email: attendees.email,
    ticketId: attendees.ticketId,
    ticketName: tickets.name,
    status: attendees.status,
    checkedInAt: attendees.checkedInAt,
    orderReference: attendees.orderReference,
  })
    .from(attendees)
    .leftJoin(tickets, eq(attendees.ticketId, tickets.id))
    .where(and(eq(attendees.id, attendeeId), eq(attendees.eventId, eventId)))
    .limit(1);

  if (!attendee) {
    sendError(res, 'Invalid ticket - attendee not found', 404, 'INVALID_TICKET');
    return;
  }

  if (attendee.status === 'checked-in') {
    sendSuccess(res, { ...attendee, alreadyCheckedIn: true }, 'Ticket already checked in');
    return;
  }

  if (attendee.status === 'cancelled') {
    sendError(res, 'This ticket has been cancelled', 400, 'TICKET_CANCELLED');
    return;
  }

  // Check in the attendee
  await db.update(attendees)
    .set({ status: 'checked-in', checkedInAt: new Date(), updatedAt: new Date() })
    .where(eq(attendees.id, attendeeId));

  sendSuccess(res, { ...attendee, status: 'checked-in', checkedInAt: new Date(), alreadyCheckedIn: false }, 'Checked in successfully');
}
