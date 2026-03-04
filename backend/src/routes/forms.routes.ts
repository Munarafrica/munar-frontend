import { Router } from 'express';
import {
  getForms, getForm, createForm, updateForm, deleteForm, duplicateForm,
  submitFormResponse,
  getFormResponses, deleteResponse, exportResponses,
  getFormAnalytics,
} from '../controllers/forms.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ── Forms CRUD ────────────────────────────────────────────
router.get('/:eventId/forms',         requireAuth, getForms);
router.get('/:eventId/forms/:id',     requireAuth, getForm);
router.post('/:eventId/forms',        requireAuth, createForm);
router.put('/:eventId/forms/:id',     requireAuth, updateForm);
router.patch('/:eventId/forms/:id',   requireAuth, updateForm);
router.delete('/:eventId/forms/:id',  requireAuth, deleteForm);
router.post('/:eventId/forms/:id/duplicate', requireAuth, duplicateForm);

// ── Analytics ────────────────────────────────────────────
router.get('/:eventId/forms/:id/analytics', requireAuth, getFormAnalytics);

// ── Responses ────────────────────────────────────────────
router.get('/:eventId/forms/:id/responses',                      requireAuth, getFormResponses);
router.delete('/:eventId/forms/:id/responses/:responseId',       requireAuth, deleteResponse);
router.get('/:eventId/forms/:id/responses/export',               requireAuth, exportResponses);

// ── Public submission (event attendees) ──────────────────
router.post('/:eventId/forms/:id/submit', optionalAuth, submitFormResponse);

export default router;
