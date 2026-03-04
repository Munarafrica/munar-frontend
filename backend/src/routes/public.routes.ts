// Public (no-auth) form routes
// GET  /api/public/e/:slug/forms             – list published forms for an event
// GET  /api/public/e/:slug/forms/:formId     – get a single published form
// POST /api/public/e/:slug/forms/:formId/submit – submit a response
// GET  /api/public/forms/:token             – get a published form by share token
// POST /api/public/forms/:token/submit       – submit a response via share token
//
// Public (no-auth) ticket routes
// GET  /api/public/e/:slug/tickets           – list available tickets for purchase
// POST /api/public/e/:slug/tickets/checkout  – complete ticket purchase
// GET  /api/public/orders/:orderRef          – get order details by reference
// POST /api/public/tickets/validate          – validate a ticket QR code

import { Router } from 'express';
import {
  getPublicForms,
  getPublicFormBySlug,
  submitFormBySlug,
  getPublicFormByToken,
  submitByToken,
} from '../controllers/forms.controller';
import {
  getPublicTickets,
  publicCheckout,
  getPublicOrder,
  validateTicket,
} from '../controllers/tickets.controller';

const router = Router();

// ── By event slug (forms) ─────────────────────────────────
router.get('/e/:slug/forms',                        getPublicForms);
router.get('/e/:slug/forms/:formId',                getPublicFormBySlug);
router.post('/e/:slug/forms/:formId/submit',        submitFormBySlug);

// ── By share token (forms) ────────────────────────────────
router.get('/forms/:token',          getPublicFormByToken);
router.post('/forms/:token/submit',  submitByToken);

// ── Public ticket routes ──────────────────────────────────
router.get('/e/:slug/tickets',                      getPublicTickets);
router.post('/e/:slug/tickets/checkout',            publicCheckout);
router.get('/orders/:orderRef',                     getPublicOrder);
router.post('/tickets/validate',                    validateTicket);

export default router;
