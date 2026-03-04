import { Router } from 'express';
import {
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getCategories, createCategory,
  getContestants, createContestant,
  castVote,
} from '../controllers/voting.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Campaigns
router.get('/:eventId/voting/campaigns', requireAuth, getCampaigns);
router.post('/:eventId/voting/campaigns', requireAuth, createCampaign);
router.patch('/:eventId/voting/campaigns/:campaignId', requireAuth, updateCampaign);
router.delete('/:eventId/voting/campaigns/:campaignId', requireAuth, deleteCampaign);

// Categories
router.get('/:eventId/voting/campaigns/:campaignId/categories', optionalAuth, getCategories);
router.post('/:eventId/voting/campaigns/:campaignId/categories', requireAuth, createCategory);

// Contestants
router.get('/:eventId/voting/campaigns/:campaignId/categories/:categoryId/contestants', optionalAuth, getContestants);
router.post('/:eventId/voting/campaigns/:campaignId/categories/:categoryId/contestants', requireAuth, createContestant);

// Vote (public)
router.post('/:eventId/voting/campaigns/:campaignId/vote', optionalAuth, castVote);

export default router;
