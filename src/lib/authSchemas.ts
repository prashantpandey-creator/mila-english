import { z } from 'zod';
import { normalizeEmail } from '@/lib/auth';

const email = z.string().trim().email().max(254).transform(normalizeEmail);
const password = z.string().min(8).max(128);
const learnerCategory = z
  .enum(['absolute_beginner', 'beginner', 'intermediate', 'adult_learner', 'adult_beginner', 'pending'])
  // Older native builds used `adult_beginner`. Preserve their API contract but
  // store one canonical value for downstream personalization.
  .transform((value) => value === 'adult_beginner' ? 'adult_learner' as const : value);

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
  // Mila may carry a deliberate landing-page language choice into sign-in.
  // The login route validates it against the market catalog before applying it.
  nativeLanguage: z.string().trim().max(40).optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email,
  password,
  // Mila validates this against its market catalog at the route boundary.
  // "Not set" remains available only for the separate Gia account flow.
  nativeLanguage: z.string().trim().min(1).max(40).default('Not set'),
  learnerCategory: learnerCategory.default('absolute_beginner'),
  level: z.string().trim().max(20).optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password,
});
