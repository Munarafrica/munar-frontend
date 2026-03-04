import { Router } from 'express';
import { getSponsors, createSponsor, updateSponsor, deleteSponsor } from '../controllers/sponsors.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/:eventId/sponsors', requireAuth, getSponsors);
router.post('/:eventId/sponsors', requireAuth, createSponsor);
router.put('/:eventId/sponsors/:id', requireAuth, updateSponsor);
router.patch('/:eventId/sponsors/:id', requireAuth, updateSponsor);
router.delete('/:eventId/sponsors/:id', requireAuth, deleteSponsor);

export default router;
