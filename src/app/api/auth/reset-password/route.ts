import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/authSchemas';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';

export async function POST(request: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Use a valid reset link and a password of at least 8 characters.', code: 'INVALID_INPUT' }, { status: 400 });
  }

  const rate = consumeAuthAttempt(`reset:${requestIdentity(request)}`, { limit: 6, windowMs: 60 * 60_000 });
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' }, { status: 429 });
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const token = await prisma.accountToken.findUnique({ where: { tokenHash } });
  if (!token || token.type !== 'password_reset' || token.usedAt || token.expiresAt <= new Date()) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.', code: 'INVALID_TOKEN' }, { status: 400 });
  }

  const password = await hashPassword(parsed.data.password);
  const user = await prisma.$transaction(async (tx) => {
    // Claim the token inside the same write transaction as the password. Two
    // simultaneous requests cannot both pass this conditional update.
    const claimed = await tx.accountToken.updateMany({
      where: { id: token.id, type: 'password_reset', usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    const updated = await tx.user.update({
      where: { id: token.userId },
      // A successfully used reset link also proves control of this email.
      data: { password, accountType: 'registered', emailVerifiedAt: new Date(), sessionVersion: { increment: 1 } },
    });
    await tx.accountToken.updateMany({
      where: { userId: token.userId, type: 'password_reset', usedAt: null },
      data: { usedAt: new Date() },
    });
    return updated;
  });
  if (!user) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.', code: 'INVALID_TOKEN' }, { status: 400 });
  }

  await createSession(user);
  return NextResponse.json({ ok: true });
}
