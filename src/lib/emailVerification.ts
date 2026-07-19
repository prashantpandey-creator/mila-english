import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { sendEmailVerification } from '@/lib/sendAuthEmail';

export async function issueEmailVerification(input: { userId: number; email: string; baseUrl: string }) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.$transaction([
    prisma.accountToken.updateMany({
      where: { userId: input.userId, type: 'email_verification', usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.accountToken.create({
      data: { userId: input.userId, type: 'email_verification', tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) },
    }),
  ]);

  // Put bearer material in the fragment. Browsers do not send fragments in
  // HTTP requests, access logs, or Referrer headers.
  const verificationUrl = `${input.baseUrl.replace(/\/$/, '')}/verify-email#token=${encodeURIComponent(token)}`;
  try {
    await sendEmailVerification({ email: input.email, verificationUrl });
    return { sent: true, verificationUrl };
  } catch (error) {
    await prisma.accountToken.updateMany({ where: { tokenHash, usedAt: null }, data: { usedAt: new Date() } });
    throw error;
  }
}
