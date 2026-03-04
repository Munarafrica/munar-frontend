import { Router } from 'express';
import {
  login,
  signUp,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  verifyResetPin,
  changePassword,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Public auth routes
router.post('/login', login);
router.post('/signup', signUp);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Email verification
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset flow (PIN-based)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-pin', verifyResetPin);
router.post('/reset-password', resetPassword);

// Authenticated routes
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/change-password', requireAuth, changePassword);

export default router;
