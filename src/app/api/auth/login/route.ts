import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createSession,
  DUMMY_PASSWORD_HASH,
  hashPassword,
  isGuestIdentity,
  passwordNeedsUpgrade,
  verifyPassword,
} from '@/lib/auth';
import { loginSchema } from '@/lib/authSchemas';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';
import { publicUser } from '@/lib/publicUser';

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email and password.', code: 'INVALID_INPUT' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const identity = requestIdentity(request);
  const ipRate = consumeAuthAttempt(`login-ip:${identity}`, { limit: 30, windowMs: 15 * 60_000 });
  const emailRate = consumeAuthAttempt(`login-email:${email}`, { limit: 8, windowMs: 15 * 60_000 });
  if (!ipRate.allowed || !emailRate.allowed) {
    const retryAfterSeconds = Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await verifyPassword(password, user?.password || DUMMY_PASSWORD_HASH);
  // Guest placeholders are session-only profiles, not password accounts. In
  // particular, never let the historical shared pilot guest be promoted by
  // signing in with its once-public bootstrap password.
  if (!user || isGuestIdentity(user.accountType, user.email) || !passwordMatches) {
    return NextResponse.json({ error: 'Email or password is incorrect.', code: 'INVALID_CREDENTIALS' }, { status: 401 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      accountType: 'registered',
      ...(passwordNeedsUpgrade(user.password) ? { password: await hashPassword(password) } : {}),
    },
  });
  await createSession(updated);
  return NextResponse.json(publicUser(updated));
}
