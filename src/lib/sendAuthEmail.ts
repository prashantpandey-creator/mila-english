async function sendAuthEmail(input: { email: string; subject: string; text: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim() || 'Mila <onboarding@resend.dev>';
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

export async function sendPasswordResetEmail(input: { email: string; resetUrl: string }) {
  return sendAuthEmail({
    email: input.email,
    subject: 'Reset your Mila password',
    text: `Reset your Mila password: ${input.resetUrl}\n\nThis link expires in 30 minutes. If you did not request it, you can ignore this email.`,
    html: `<p>Use this private link to reset your Mila password:</p><p><a href="${input.resetUrl}">Reset my password</a></p><p>The link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`,
  });
}

export async function sendEmailVerification(input: { email: string; verificationUrl: string }) {
  return sendAuthEmail({
    email: input.email,
    subject: 'Verify your Mila email',
    text: `Verify your Mila email: ${input.verificationUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    html: `<p>Confirm this email belongs to your Mila account:</p><p><a href="${input.verificationUrl}">Verify my email</a></p><p>The link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
  });
}
