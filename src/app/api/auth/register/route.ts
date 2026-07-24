import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, createSession, hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/authSchemas';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';
import { publicUser } from '@/lib/publicUser';
import { issueEmailVerification } from '@/lib/emailVerification';
import { GIA_ORIGIN, isGiaHostname } from '@/lib/productHosts';

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Check your name, email, and password. Passwords need at least 8 characters.',
      code: 'INVALID_INPUT',
    }, { status: 400 });
  }

  const rate = consumeAuthAttempt(`register:${requestIdentity(request)}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many account attempts. Try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  const { email, name, password, nativeLanguage, learnerCategory, level } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'An account already uses this email. Sign in instead.', code: 'ACCOUNT_EXISTS' }, { status: 409 });
  }

  const current = await authenticate(request);
  if (current?.accountType === 'registered') {
    return NextResponse.json({ error: 'Sign out before creating another account.', code: 'ALREADY_SIGNED_IN' }, { status: 409 });
  }
  const passwordHash = await hashPassword(password);

  // Upgrade the current guest row in place. Every lesson, assessment, word,
  // voice memory, and progress record remains attached to the same learner id.
  let user;
  try {
    user = current?.accountType === 'guest'
      ? await prisma.user.update({
          where: { id: Number(current.sub) },
          data: {
            email,
            name,
            password: passwordHash,
            nativeLanguage,
            learnerCategory,
            level: level || undefined,
            accountType: 'registered',
            emailVerifiedAt: null,
            sessionVersion: { increment: 1 },
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name,
            password: passwordHash,
            learnerCategory,
            nativeLanguage,
            level: level || 'pending',
            accountType: 'registered',
            emailVerifiedAt: null,
            joinDate: new Date(),
          },
        });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'An account already uses this email. Sign in instead.', code: 'ACCOUNT_EXISTS' }, { status: 409 });
    }
    throw error;
  }

  await createSession(user);
  const isGia = isGiaHostname(request.headers.get('host'));
  const brand = isGia ? 'Gia' : 'Mila';
  let verificationEmailSent = false;
  let verificationUrl: string | undefined;
  try {
    const issued = await issueEmailVerification({
      userId: user.id,
      email: user.email,
      baseUrl: isGia ? GIA_ORIGIN : (process.env.APP_URL?.trim() || request.nextUrl.origin),
      brand,
    });
    verificationEmailSent = issued.sent;
    if (process.env.NODE_ENV !== 'production') verificationUrl = issued.verificationUrl;
  } catch (error) {
    console.error(`Could not send ${brand} verification email`, error);
  }
  return NextResponse.json({ ...publicUser(user), verificationEmailSent, ...(verificationUrl ? { verificationUrl } : {}) }, { status: current?.accountType === 'guest' ? 200 : 201 });
}
