import { Router } from 'express';
import {
  getTickets, getTicket, createTicket, updateTicket, deleteTicket,
  duplicateTicket, reorderTickets, getTicketAnalytics,
  getAttendees, checkInAttendee, undoCheckIn, exportAttendees,
  getOrders,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
  getSettings, updateSettings,
} from '../controllers/tickets.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// ── Ticket CRUD ───────────────────────────────────────────
router.get('/:eventId/tickets',                      requireAuth, getTickets);
router.get('/:eventId/tickets/analytics',            requireAuth, getTicketAnalytics);
router.get('/:eventId/tickets/:id',                  requireAuth, getTicket);
router.post('/:eventId/tickets',                     requireAuth, createTicket);
router.put('/:eventId/tickets/:id',                  requireAuth, updateTicket);
router.patch('/:eventId/tickets/:id',                requireAuth, updateTicket);
router.delete('/:eventId/tickets/:id',               requireAuth, deleteTicket);
router.post('/:eventId/tickets/:id/duplicate',       requireAuth, duplicateTicket);
router.patch('/:eventId/tickets/reorder',            requireAuth, reorderTickets);

// ── Attendees ─────────────────────────────────────────────
router.get('/:eventId/attendees',                    requireAuth, getAttendees);
router.get('/:eventId/attendees/export',             requireAuth, exportAttendees);
router.patch('/:eventId/attendees/:id/check-in',     requireAuth, checkInAttendee);
router.patch('/:eventId/attendees/:id/undo-check-in', requireAuth, undoCheckIn);

// ── Orders ────────────────────────────────────────────────
router.get('/:eventId/orders',                       requireAuth, getOrders);

// ── Checkout Questions ────────────────────────────────────
router.get('/:eventId/ticket-questions',             requireAuth, getQuestions);
router.post('/:eventId/ticket-questions',            requireAuth, createQuestion);
router.put('/:eventId/ticket-questions/:id',         requireAuth, updateQuestion);
router.delete('/:eventId/ticket-questions/:id',      requireAuth, deleteQuestion);

// ── Ticket Settings ───────────────────────────────────────
router.get('/:eventId/ticket-settings',              requireAuth, getSettings);
router.put('/:eventId/ticket-settings',              requireAuth, updateSettings);

export default router;
