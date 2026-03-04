import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, refreshTokens } from '../db/schema';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiresAt,
  tokenExpiresAt,
} from '../lib/jwt';
import { sendSuccess, sendError } from '../lib/response';
import {
  generatePin,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
} from '../lib/email';
import { z } from 'zod';

// ─── Validation Schemas ───────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  accountType: z.enum(['individual', 'organization']).optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const refreshSchema = z.object({ refreshToken: z.string() });

const forgotPasswordSchema = z.object({ email: z.string().email() });

const verifyPinSchema = z.object({
  email: z.string().email(),
  pin: z.string().length(6),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  pin: z.string().length(6),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organization: z.string().optional(),
  currency: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  accountType: z.enum(['individual', 'organization']).optional(),
});

// ─── Helpers ──────────────────────────────────────────────
const SALT_ROUNDS = 12;
const PIN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function buildAuthResponse(user: typeof users.$inferSelect, accessToken: string, refreshToken: string) {
  return {
    user: buildUserResponse(user),
    accessToken,
    refreshToken,
    expiresAt: tokenExpiresAt(process.env.JWT_ACCESS_EXPIRES_IN || '15m'),
  };
}

function buildUserResponse(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    organization: user.organization ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    accountType: user.accountType,
    currency: user.currency,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ─── POST /auth/login ─────────────────────────────────────
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    return;
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshTkn = signRefreshToken({ sub: user.id, email: user.email });

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshTkn,
    expiresAt: new Date(refreshTokenExpiresAt()),
  });

  sendSuccess(res, buildAuthResponse(user, accessToken, refreshTkn), 'Login successful');
}

// ─── POST /auth/signup ────────────────────────────────────
export async function signUp(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  const { email, password, accountType } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing) {
    sendError(res, 'An account with this email already exists', 409, 'EMAIL_TAKEN');
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const pin = generatePin();
  const pinExpiry = new Date(Date.now() + PIN_EXPIRY_MS);

  const [newUser] = await db.insert(users).values({
    email: normalizedEmail,
    passwordHash,
    accountType: accountType ?? 'individual',
    currency: 'NGN',
    isEmailVerified: false,
    emailVerificationToken: pin,
    passwordResetExpiresAt: pinExpiry,
  }).returning();

  await sendVerificationEmail(normalizedEmail, pin);

  const accessToken = signAccessToken({ sub: newUser.id, email: newUser.email });
  const refreshTkn = signRefreshToken({ sub: newUser.id, email: newUser.email });

  await db.insert(refreshTokens).values({
    userId: newUser.id,
    token: refreshTkn,
    expiresAt: new Date(refreshTokenExpiresAt()),
  });

  sendSuccess(res, buildAuthResponse(newUser, accessToken, refreshTkn), 'Account created. Verification PIN sent to your email.', 201);
}

// ─── POST /auth/verify-email ──────────────────────────────
export async function verifyEmail(req: Request, res: Response) {
  const parsed = verifyPinSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Email and 6-digit PIN are required', 400, 'VALIDATION_ERROR');
    return;
  }

  const { email, pin } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

  if (!user) {
    sendError(res, 'Invalid PIN', 400, 'INVALID_PIN');
    return;
  }

  if (user.isEmailVerified) {
    sendSuccess(res, buildUserResponse(user), 'Email already verified');
    return;
  }

  if (user.emailVerificationToken !== pin) {
    sendError(res, 'Invalid PIN. Please check and try again.', 400, 'INVALID_PIN');
    return;
  }

  if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
    sendError(res, 'PIN has expired. Please request a new one.', 400, 'PIN_EXPIRED');
    return;
  }

  const [updated] = await db.update(users)
    .set({
      isEmailVerified: true,
      emailVerificationToken: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  await sendWelcomeEmail(updated.email, updated.firstName ?? undefined);
  sendSuccess(res, buildUserResponse(updated), 'Email verified successfully');
}

// ─── POST /auth/resend-verification ───────────────────────
export async function resendVerification(req: Request, res: Response) {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Valid email is required', 400, 'VALIDATION_ERROR');
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);

  if (!user) {
    sendSuccess(res, null, 'If your email is registered, a new verification PIN has been sent.');
    return;
  }

  if (user.isEmailVerified) {
    sendSuccess(res, null, 'Email is already verified.');
    return;
  }

  const pin = generatePin();
  const pinExpiry = new Date(Date.now() + PIN_EXPIRY_MS);

  await db.update(users)
    .set({ emailVerificationToken: pin, passwordResetExpiresAt: pinExpiry, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await sendVerificationEmail(user.email, pin);
  sendSuccess(res, null, 'Verification PIN sent to your email.');
}

// ─── POST /auth/forgot-password ───────────────────────────
export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Valid email required', 400, 'VALIDATION_ERROR');
    return;
  }

  const [user] = await db.select({ id: users.id, email: users.email }).from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);

  if (user) {
    const pin = generatePin();
    const expiresAt = new Date(Date.now() + PIN_EXPIRY_MS);
    await db.update(users)
      .set({ passwordResetToken: pin, passwordResetExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await sendPasswordResetEmail(user.email, pin);
    console.log(`[Password Reset] PIN for ${user.email}: ${pin}`);
  }

  sendSuccess(res, null, 'If your email is registered, you will receive a reset PIN.');
}

// ─── POST /auth/verify-reset-pin ──────────────────────────
export async function verifyResetPin(req: Request, res: Response) {
  const parsed = verifyPinSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Email and 6-digit PIN are required', 400, 'VALIDATION_ERROR');
    return;
  }

  const { email, pin } = parsed.data;
  const [user] = await db.select().from(users)
    .where(eq(users.email, email.toLowerCase())).limit(1);

  if (!user || user.passwordResetToken !== pin) {
    sendError(res, 'Invalid PIN', 400, 'INVALID_PIN');
    return;
  }

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    sendError(res, 'PIN has expired. Please request a new one.', 400, 'PIN_EXPIRED');
    return;
  }

  sendSuccess(res, { verified: true }, 'PIN verified. You can now set a new password.');
}

// ─── POST /auth/reset-password ────────────────────────────
export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  const { email, pin, password } = parsed.data;
  const [user] = await db.select().from(users)
    .where(eq(users.email, email.toLowerCase())).limit(1);

  if (!user || user.passwordResetToken !== pin) {
    sendError(res, 'Invalid or expired reset PIN', 400, 'INVALID_PIN');
    return;
  }

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    sendError(res, 'PIN has expired. Please request a new one.', 400, 'PIN_EXPIRED');
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await db.update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Revoke all refresh tokens for security
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));

  await sendPasswordChangedEmail(user.email);
  sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
}

// ─── POST /auth/change-password ───────────────────────────
export async function changePassword(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) { sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED'); return; }

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  const { currentPassword, newPassword } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { sendError(res, 'User not found', 404, 'NOT_FOUND'); return; }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    sendError(res, 'Current password is incorrect', 400, 'INVALID_PASSWORD');
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await sendPasswordChangedEmail(user.email);
  sendSuccess(res, null, 'Password changed successfully');
}

// ─── POST /auth/refresh ───────────────────────────────────
export async function refreshAccessToken(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Refresh token required', 400, 'VALIDATION_ERROR');
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(parsed.data.refreshToken);
  } catch {
    sendError(res, 'Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    return;
  }

  const [stored] = await db.select().from(refreshTokens)
    .where(eq(refreshTokens.token, parsed.data.refreshToken)).limit(1);

  if (!stored || stored.expiresAt < new Date()) {
    sendError(res, 'Refresh token has been revoked or expired', 401, 'INVALID_TOKEN');
    return;
  }

  const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });

  sendSuccess(res, {
    accessToken,
    expiresAt: tokenExpiresAt(process.env.JWT_ACCESS_EXPIRES_IN || '15m'),
  });
}

// ─── POST /auth/logout ────────────────────────────────────
export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
  }
  sendSuccess(res, null, 'Logged out successfully');
}

// ─── GET /auth/me ─────────────────────────────────────────
export async function getMe(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) { sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED'); return; }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { sendError(res, 'User not found', 404, 'NOT_FOUND'); return; }

  sendSuccess(res, buildUserResponse(user));
}

// ─── PATCH /auth/profile ──────────────────────────────────
export async function updateProfile(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) { sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED'); return; }

  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors as Record<string, string[]>);
    return;
  }

  const [updated] = await db.update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  sendSuccess(res, buildUserResponse(updated));
}
