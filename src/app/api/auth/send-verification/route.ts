import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';
import { issueEmailVerification } from '@/lib/emailVerification';
import { prisma } from '@/lib/prisma';
import { GIA_ORIGIN, isGiaHostname } from '@/lib/productHosts';

export async function POST(request: NextRequest) {
  const session = await authenticate(request);
  const userId = Number(session?.sub);
  if (!session || session.accountType === 'guest' || !Number.isSafeInteger(userId)) {
    return NextResponse.json({ error: 'Sign in to verify this account.', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const rate = consumeAuthAttempt(`verify:${requestIdentity(request)}:${userId}`, { limit: 4, windowMs: 60 * 60_000 });
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many verification emails. Try again later.', code: 'RATE_LIMITED' }, { status: 429 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Account not found.', code: 'NOT_FOUND' }, { status: 404 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  const isGia = isGiaHostname(request.headers.get('host'));
  const brand = isGia ? 'Gia' : 'Mila';
  try {
    const issued = await issueEmailVerification({
      userId,
      email: user.email,
      baseUrl: isGia ? GIA_ORIGIN : process.env.APP_URL?.trim() || request.nextUrl.origin,
      brand,
    });
    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== 'production' ? { verificationUrl: issued.verificationUrl } : {}),
    });
  } catch (error) {
    console.error(`Could not send ${brand} verification email`, error);
    return NextResponse.json({ error: 'Verification email is not configured yet. Contact support.', code: 'EMAIL_UNAVAILABLE' }, { status: 503 });
  }
}
