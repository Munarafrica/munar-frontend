import { Router } from 'express';
import {
  getEvents,
  getEvent,
  getEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  getEventModules,
  getEventChecklist,
  getEventMetrics,
  getEventActivities,
} from '../controllers/events.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, getEvents);
router.post('/', requireAuth, createEvent);
router.get('/slug/:slug', optionalAuth, getEventBySlug);
router.get('/:id', requireAuth, getEvent);
router.put('/:id', requireAuth, updateEvent);
router.patch('/:id', requireAuth, updateEvent);
router.delete('/:id', requireAuth, deleteEvent);
router.patch('/:id/publish', requireAuth, publishEvent);
router.patch('/:id/unpublish', requireAuth, unpublishEvent);
router.get('/:id/modules', requireAuth, getEventModules);
router.get('/:id/checklist', requireAuth, getEventChecklist);
router.get('/:id/metrics', requireAuth, getEventMetrics);
router.get('/:id/activities', requireAuth, getEventActivities);

export default router;
