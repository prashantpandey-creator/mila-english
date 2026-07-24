import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/authSchemas';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';
import { isGuestIdentity } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/sendAuthEmail';
import { GIA_ORIGIN, isGiaHostname } from '@/lib/productHosts';

export async function POST(request: NextRequest) {
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });

  const identity = requestIdentity(request);
  const ipRate = consumeAuthAttempt(`forgot-ip:${identity}`, { limit: 12, windowMs: 60 * 60_000 });
  const emailRate = consumeAuthAttempt(`forgot-email:${parsed.data.email}`, { limit: 4, windowMs: 60 * 60_000 });
  if (!ipRate.allowed || !emailRate.allowed) {
    return NextResponse.json({ ok: true }, { headers: { 'Retry-After': String(Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds)) } });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || isGuestIdentity(user.accountType, user.email)) return NextResponse.json({ ok: true });

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.$transaction([
    prisma.accountToken.updateMany({
      where: { userId: user.id, type: 'password_reset', usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.accountToken.create({
      data: { userId: user.id, type: 'password_reset', tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) },
    }),
  ]);

  const isGia = isGiaHostname(request.headers.get('host'));
  const brand = isGia ? 'Gia' : 'Mila';
  const configuredBase = process.env.APP_URL?.trim();
  const base = isGia ? GIA_ORIGIN : configuredBase || request.nextUrl.origin;
  // Keep the bearer token in the URL fragment so it never reaches HTTP access
  // logs or Referrer headers. The client exchanges it in a POST request.
  const resetUrl = `${base.replace(/\/$/, '')}/reset-password#token=${encodeURIComponent(token)}`;
  try {
    await sendPasswordResetEmail({ brand, email: user.email, resetUrl });
  } catch (error) {
    console.error(`Could not send ${brand} password reset email`, error);
    await prisma.accountToken.updateMany({ where: { tokenHash, usedAt: null }, data: { usedAt: new Date() } });
  }

  return NextResponse.json({
    ok: true,
    ...(process.env.NODE_ENV !== 'production' ? { resetUrl } : {}),
  });
}
