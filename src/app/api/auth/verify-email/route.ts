import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';

export async function POST(request: NextRequest) {
  const rate = consumeAuthAttempt(`verify-token:${requestIdentity(request)}`, { limit: 12, windowMs: 60 * 60_000 });
  if (!rate.allowed) return NextResponse.json({ error: 'Too many attempts.', code: 'RATE_LIMITED' }, { status: 429 });
  const body = await request.json().catch(() => null);
  const raw = typeof body?.token === 'string' ? body.token : '';
  if (raw.length < 32 || raw.length > 256) {
    return NextResponse.json({ error: 'This verification link is invalid.', code: 'INVALID_TOKEN' }, { status: 400 });
  }
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  const token = await prisma.accountToken.findUnique({ where: { tokenHash } });
  if (!token || token.type !== 'email_verification' || token.usedAt || token.expiresAt <= new Date()) {
    return NextResponse.json({ error: 'This verification link is invalid or expired.', code: 'INVALID_TOKEN' }, { status: 400 });
  }
  const verified = await prisma.$transaction(async (tx) => {
    const claimed = await tx.accountToken.updateMany({
      where: { id: token.id, type: 'email_verification', usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } });
    await tx.accountToken.updateMany({
      where: { userId: token.userId, type: 'email_verification', usedAt: null },
      data: { usedAt: new Date() },
    });
    return true;
  });
  if (!verified) {
    return NextResponse.json({ error: 'This verification link is invalid or expired.', code: 'INVALID_TOKEN' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
