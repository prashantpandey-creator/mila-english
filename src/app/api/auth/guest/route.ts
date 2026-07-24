import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, createSession, hashPassword } from '@/lib/auth';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';
import { publicUser } from '@/lib/publicUser';
import { resolveIndianNativeLanguage } from '@/lib/learningMarkets';
import { isGiaHostname } from '@/lib/productHosts';

export async function POST(request: NextRequest) {
  const current = await authenticate(request);
  if (current) {
    const existing = await prisma.user.findUnique({ where: { id: Number(current.sub) } });
    if (existing) return NextResponse.json(publicUser(existing));
  }

  const rate = consumeAuthAttempt(`guest:${requestIdentity(request)}`, { limit: 6, windowMs: 60 * 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many guest profiles were created. Try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  const isGia = isGiaHostname(request.headers.get('host'));
  const body = await request.json().catch(() => null);
  const selectedNativeLanguage = resolveIndianNativeLanguage(body?.nativeLanguage);
  if (!isGia && body?.nativeLanguage && !selectedNativeLanguage) {
    return NextResponse.json({
      error: 'Choose a supported native language.',
      code: 'INVALID_NATIVE_LANGUAGE',
    }, { status: 400 });
  }

  const guestId = randomUUID();
  const user = await prisma.user.create({
    data: {
      email: `guest-${guestId}@mila.local`,
      name: 'Guest',
      password: await hashPassword(randomBytes(32).toString('hex')),
      learnerCategory: 'pending',
      // Guest entry points in Mila's onboarding always send this choice.
      // Other product/internal guest flows remain deliberately unclassified
      // instead of silently assuming Hindi or retaining the old Russian default.
      nativeLanguage: selectedNativeLanguage?.name ?? 'Not set',
      level: 'pending',
      accountType: 'guest',
      joinDate: new Date(),
    },
  });

  await createSession(user);
  return NextResponse.json(publicUser(user));
}
