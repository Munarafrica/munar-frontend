import { Request, Response } from 'express';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { forms, formResponses, events } from '../db/schema';
import { sendSuccess, sendError } from '../lib/response';
import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────

async function assertEventOwner(
  eventId: string,
  userId: string,
  res: Response,
): Promise<boolean> {
  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.ownerId, userId)))
    .limit(1);
  if (!ev) {
    sendError(res, 'Event not found or access denied', 404, 'NOT_FOUND');
    return false;
  }
  return true;
}

// ─── Validation schemas ───────────────────────────────────

const formSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional(),
  type:        z.enum(['registration', 'survey', 'feedback', 'custom']).optional(),
  status:      z.enum(['draft', 'published', 'closed', 'scheduled']).optional(),
  fields:      z.array(z.any()).optional(),
  settings:    z.any().optional(),
});

const responseSubmitSchema = z.object({
  respondentName:  z.string().optional(),
  respondentEmail: z.string().email().optional().or(z.literal('')),
  answers:         z.record(z.any()),
  metadata:        z.record(z.any()).optional(),
});

// ─── Admin: Forms CRUD ────────────────────────────────────

export async function getForms(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const rows = await db
    .select()
    .from(forms)
    .where(eq(forms.eventId, req.params.eventId))
    .orderBy(desc(forms.createdAt));

  sendSuccess(res, rows);
}

export async function getForm(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const [row] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, req.params.id), eq(forms.eventId, req.params.eventId)))
    .limit(1);

  if (!row) { sendError(res, 'Form not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}

export async function createForm(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const parsed = formSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }

  const shareToken = randomUUID();
  const [row] = await db
    .insert(forms)
    .values({ eventId: req.params.eventId, shareToken, ...parsed.data })
    .returning();

  sendSuccess(res, row, 'Form created', 201);
}

export async function updateForm(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const parsed = formSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }

  const [row] = await db
    .update(forms)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(forms.id, req.params.id), eq(forms.eventId, req.params.eventId)))
    .returning();

  if (!row) { sendError(res, 'Form not found', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}

export async function deleteForm(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  await db
    .delete(forms)
    .where(and(eq(forms.id, req.params.id), eq(forms.eventId, req.params.eventId)));

  sendSuccess(res, { id: req.params.id });
}

export async function duplicateForm(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const [original] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, req.params.id), eq(forms.eventId, req.params.eventId)))
    .limit(1);

  if (!original) { sendError(res, 'Form not found', 404, 'NOT_FOUND'); return; }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, shareToken: _token, responseCount: _rc, createdAt: _ca, updatedAt: _ua, ...rest } = original;
  const [copy] = await db
    .insert(forms)
    .values({
      ...rest,
      title:      `${original.title} (Copy)`,
      status:     'draft',
      shareToken: randomUUID(),
    })
    .returning();

  sendSuccess(res, copy, 'Form duplicated', 201);
}

// ─── Admin: Responses ─────────────────────────────────────

export async function getFormResponses(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const page   = Math.max(1, Number(req.query.page)  || 1);
  const limit  = Math.min(100, Number(req.query.limit) || 50);
  const offset = (page - 1) * limit;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(formResponses)
      .where(and(
        eq(formResponses.formId,  req.params.id),
        eq(formResponses.eventId, req.params.eventId),
      ))
      .orderBy(desc(formResponses.submittedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(formResponses)
      .where(and(
        eq(formResponses.formId,  req.params.id),
        eq(formResponses.eventId, req.params.eventId),
      )),
  ]);

  const total = Number(totalResult[0]?.total ?? 0);

  sendSuccess(res, {
    data: rows,
    meta: {
      currentPage:     page,
      totalPages:      Math.ceil(total / limit),
      totalItems:      total,
      itemsPerPage:    limit,
      hasNextPage:     page * limit < total,
      hasPreviousPage: page > 1,
    },
  });
}

export async function deleteResponse(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const [deleted] = await db
    .delete(formResponses)
    .where(and(
      eq(formResponses.id,      req.params.responseId),
      eq(formResponses.formId,  req.params.id),
      eq(formResponses.eventId, req.params.eventId),
    ))
    .returning({ id: formResponses.id });

  if (!deleted) { sendError(res, 'Response not found', 404, 'NOT_FOUND'); return; }

  await db.execute(sql`
    UPDATE forms
    SET response_count = GREATEST(0, response_count - 1)
    WHERE id = ${req.params.id}
  `);

  sendSuccess(res, { id: req.params.responseId });
}

export async function exportResponses(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';

  const [[form], rows] = await Promise.all([
    db
      .select()
      .from(forms)
      .where(and(eq(forms.id, req.params.id), eq(forms.eventId, req.params.eventId)))
      .limit(1),
    db
      .select()
      .from(formResponses)
      .where(and(
        eq(formResponses.formId,  req.params.id),
        eq(formResponses.eventId, req.params.eventId),
      ))
      .orderBy(desc(formResponses.submittedAt)),
  ]);

  if (!form) { sendError(res, 'Form not found', 404, 'NOT_FOUND'); return; }

  // Build field label map from form.fields (array of {id, label, ...})
  const fields: Array<{ id: string; label: string }> =
    Array.isArray(form.fields) ? (form.fields as any[]) : [];

  const headers = [
    'Submitted At',
    'Respondent Name',
    'Respondent Email',
    ...fields.map((f) => f.label || f.id),
  ];

  const dataRows = rows.map((r) => {
    const answers: Record<string, any> = (r.answers as Record<string, any>) ?? {};
    return [
      new Date(r.submittedAt).toISOString(),
      r.respondentName  ?? '',
      r.respondentEmail ?? '',
      ...fields.map((f) => {
        const val = answers[f.id];
        if (Array.isArray(val)) return val.join(', ');
        return val ?? '';
      }),
    ];
  });

  const wsData = [headers, ...dataRows];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Responses');

  const safeTitle = form.title.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  const filename  = `${safeTitle}_responses.${format}`;

  if (format === 'xlsx') {
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(Buffer.from(buffer));
  } else {
    const csv = XLSX.utils.sheet_to_csv(ws);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  }
}

// ─── Admin: Analytics ────────────────────────────────────

export async function getFormAnalytics(req: Request, res: Response) {
  if (!(await assertEventOwner(req.params.eventId, req.user!.sub, res))) return;

  const [form] = await db
    .select({ id: forms.id, responseCount: forms.responseCount })
    .from(forms)
    .where(and(eq(forms.id, req.params.id), eq(forms.eventId, req.params.eventId)))
    .limit(1);

  if (!form) { sendError(res, 'Form not found', 404, 'NOT_FOUND'); return; }

  // Responses grouped by day (last 30 days)
  const byDayResult = await db.execute(sql`
    SELECT
      TO_CHAR(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
      COUNT(*)::text AS cnt
    FROM form_responses
    WHERE form_id = ${form.id}
      AND submitted_at >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day ASC
  `);

  const responsesByDay = (byDayResult as any[]).map((r: any) => ({
    date:  r.day as string,
    count: Number(r.cnt),
  }));

  // Average time-to-complete from metadata (if client sends metadata.timeToComplete in seconds)
  const avgResult = await db.execute(sql`
    SELECT AVG((metadata->>'timeToComplete')::numeric)::numeric AS avg_seconds
    FROM form_responses
    WHERE form_id = ${form.id}
      AND metadata->>'timeToComplete' IS NOT NULL
  `);
  const averageTimeToComplete = Math.round(Number((avgResult as any[])[0]?.avg_seconds ?? 0));

  sendSuccess(res, {
    totalResponses:        form.responseCount,
    completionRate:        100, // All stored responses are complete submissions
    averageTimeToComplete,
    responsesByDay,
  });
}

// ─── Public: Submit response (by eventId + formId) ────────

export async function submitFormResponse(req: Request, res: Response) {
  const [form] = await db
    .select({ id: forms.id, eventId: forms.eventId, status: forms.status })
    .from(forms)
    .where(eq(forms.id, req.params.id))
    .limit(1);

  if (!form || form.status !== 'published') {
    sendError(res, 'Form not available', 404, 'NOT_FOUND');
    return;
  }

  const parsed = responseSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }

  const [row] = await db
    .insert(formResponses)
    .values({ formId: form.id, eventId: form.eventId, ...parsed.data })
    .returning();

  await db.execute(sql`
    UPDATE forms SET response_count = response_count + 1 WHERE id = ${form.id}
  `);

  sendSuccess(res, row, 'Response submitted', 201);
}

// ─── Public: List & get forms by event slug ───────────────

export async function getPublicForms(req: Request, res: Response) {
  const [ev] = await db
    .select({ id: events.id, name: events.name })
    .from(events)
    .where(eq(events.slug, req.params.slug))
    .limit(1);

  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  const rows = await db
    .select({
      id:            forms.id,
      title:         forms.title,
      description:   forms.description,
      type:          forms.type,
      status:        forms.status,
      fields:        forms.fields,
      settings:      forms.settings,
      responseCount: forms.responseCount,
    })
    .from(forms)
    .where(and(eq(forms.eventId, ev.id), eq(forms.status, 'published')))
    .orderBy(desc(forms.createdAt));

  sendSuccess(res, { event: ev, forms: rows });
}

export async function getPublicFormBySlug(req: Request, res: Response) {
  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.slug, req.params.slug))
    .limit(1);

  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  const [row] = await db
    .select({
      id:          forms.id,
      title:       forms.title,
      description: forms.description,
      type:        forms.type,
      status:      forms.status,
      fields:      forms.fields,
      settings:    forms.settings,
    })
    .from(forms)
    .where(and(
      eq(forms.id,      req.params.formId),
      eq(forms.eventId, ev.id),
      eq(forms.status,  'published'),
    ))
    .limit(1);

  if (!row) { sendError(res, 'Form not found or not active', 404, 'NOT_FOUND'); return; }
  sendSuccess(res, row);
}

export async function submitFormBySlug(req: Request, res: Response) {
  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.slug, req.params.slug))
    .limit(1);

  if (!ev) { sendError(res, 'Event not found', 404, 'NOT_FOUND'); return; }

  const [form] = await db
    .select({ id: forms.id, eventId: forms.eventId, status: forms.status })
    .from(forms)
    .where(and(eq(forms.id, req.params.formId), eq(forms.eventId, ev.id)))
    .limit(1);

  if (!form || form.status !== 'published') {
    sendError(res, 'Form not available', 404, 'NOT_FOUND');
    return;
  }

  const parsed = responseSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }

  const [row] = await db
    .insert(formResponses)
    .values({ formId: form.id, eventId: form.eventId, ...parsed.data })
    .returning();

  await db.execute(sql`
    UPDATE forms SET response_count = response_count + 1 WHERE id = ${form.id}
  `);

  sendSuccess(res, row, 'Response submitted', 201);
}

// ─── Public: Get form + submit by share token ─────────────

export async function getPublicFormByToken(req: Request, res: Response) {
  const [row] = await db
    .select({
      id:          forms.id,
      title:       forms.title,
      description: forms.description,
      type:        forms.type,
      status:      forms.status,
      fields:      forms.fields,
      settings:    forms.settings,
    })
    .from(forms)
    .where(eq(forms.shareToken, req.params.token))
    .limit(1);

  if (!row || row.status !== 'published') {
    sendError(res, 'Form not found or not active', 404, 'NOT_FOUND');
    return;
  }
  sendSuccess(res, row);
}

export async function submitByToken(req: Request, res: Response) {
  const [form] = await db
    .select({ id: forms.id, eventId: forms.eventId, status: forms.status })
    .from(forms)
    .where(eq(forms.shareToken, req.params.token))
    .limit(1);

  if (!form || form.status !== 'published') {
    sendError(res, 'Form not available', 404, 'NOT_FOUND');
    return;
  }

  const parsed = responseSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }

  const [row] = await db
    .insert(formResponses)
    .values({ formId: form.id, eventId: form.eventId, ...parsed.data })
    .returning();

  await db.execute(sql`
    UPDATE forms SET response_count = response_count + 1 WHERE id = ${form.id}
  `);

  sendSuccess(res, row, 'Response submitted', 201);
}
