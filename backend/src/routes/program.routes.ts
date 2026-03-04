import { Router } from 'express';
import {
  // Speakers
  getSpeakers, getSpeaker, createSpeaker, updateSpeaker, deleteSpeaker, reorderSpeakers,
  // Sessions
  getSessions, getSession, createSession, updateSession, deleteSession, reorderSessions, getSchedule,
  // Tracks
  getTracks, createTrack, updateTrack, deleteTrack,
  // Public
  getPublicSpeakers, getPublicSchedule,
} from '../controllers/program.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// ─── Speakers (authenticated) ─────────────────────────────
router.get('/:eventId/speakers', requireAuth, getSpeakers);
router.post('/:eventId/speakers', requireAuth, createSpeaker);
router.post('/:eventId/speakers/reorder', requireAuth, reorderSpeakers);
router.get('/:eventId/speakers/:id', requireAuth, getSpeaker);
router.put('/:eventId/speakers/:id', requireAuth, updateSpeaker);
router.patch('/:eventId/speakers/:id', requireAuth, updateSpeaker);
router.delete('/:eventId/speakers/:id', requireAuth, deleteSpeaker);

// ─── Sessions (authenticated) ─────────────────────────────
router.get('/:eventId/sessions', requireAuth, getSessions);
router.post('/:eventId/sessions', requireAuth, createSession);
router.post('/:eventId/sessions/reorder', requireAuth, reorderSessions);
router.get('/:eventId/sessions/:id', requireAuth, getSession);
router.put('/:eventId/sessions/:id', requireAuth, updateSession);
router.patch('/:eventId/sessions/:id', requireAuth, updateSession);
router.delete('/:eventId/sessions/:id', requireAuth, deleteSession);

// ─── Schedule (authenticated) ─────────────────────────────
router.get('/:eventId/schedule', requireAuth, getSchedule);

// ─── Tracks (authenticated) ───────────────────────────────
router.get('/:eventId/tracks', requireAuth, getTracks);
router.post('/:eventId/tracks', requireAuth, createTrack);
router.put('/:eventId/tracks/:id', requireAuth, updateTrack);
router.patch('/:eventId/tracks/:id', requireAuth, updateTrack);
router.delete('/:eventId/tracks/:id', requireAuth, deleteTrack);

// ─── Public (no auth) ─────────────────────────────────────
router.get('/:eventId/public/speakers', getPublicSpeakers);
router.get('/:eventId/public/schedule', getPublicSchedule);

export default router;
