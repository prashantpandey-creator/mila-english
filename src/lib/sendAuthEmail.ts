import { MILA_PUBLIC_BRAND } from '@/lib/milaBrand';

export type AuthBrand = 'Mila' | 'Gia';

function authBrandDisplayName(brand: AuthBrand) {
  return brand === 'Mila' ? MILA_PUBLIC_BRAND.name : brand;
}

function brandedSender(brand: AuthBrand) {
  const productFrom = process.env[`${brand.toUpperCase()}_AUTH_EMAIL_FROM`]?.trim();
  if (productFrom) return productFrom;

  const sharedFrom = process.env.AUTH_EMAIL_FROM?.trim() || 'onboarding@resend.dev';
  const address = sharedFrom.match(/<([^>]+)>/)?.[1] || sharedFrom;
  return `${authBrandDisplayName(brand)} <${address}>`;
}

async function sendAuthEmail(input: { brand: AuthBrand; email: string; subject: string; text: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = brandedSender(input.brand);
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Authentication email failed (${response.status})`);
}

export async function sendPasswordResetEmail(input: { brand: AuthBrand; email: string; resetUrl: string }) {
  const displayName = authBrandDisplayName(input.brand);
  return sendAuthEmail({
    brand: input.brand,
    email: input.email,
    subject: `Reset your ${displayName} password`,
    text: `Reset your ${displayName} password: ${input.resetUrl}\n\nThis link expires in 30 minutes. If you did not request it, you can ignore this email.`,
    html: `<p>Use this private link to reset your ${displayName} password:</p><p><a href="${input.resetUrl}">Reset my password</a></p><p>The link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`,
  });
}

export async function sendEmailVerification(input: { brand: AuthBrand; email: string; verificationUrl: string }) {
  const displayName = authBrandDisplayName(input.brand);
  return sendAuthEmail({
    brand: input.brand,
    email: input.email,
    subject: `Verify your ${displayName} email`,
    text: `Verify your ${displayName} email: ${input.verificationUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    html: `<p>Confirm this email belongs to your ${displayName} account:</p><p><a href="${input.verificationUrl}">Verify my email</a></p><p>The link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
  });
}
