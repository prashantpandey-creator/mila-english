import 'server-only';
import { randomUUID } from 'node:crypto';
import { BUG_REPORT_RECIPIENT, buildBugReportEmail, type BugReport, type BugReportEmailContext } from '@/lib/bugReport';

export type BugReportDeliveryResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'unavailable' | 'failed' };

const DELIVERY_WINDOW_MS = 60 * 60 * 1000;
const DELIVERY_MAX = 5;
const deliveryBuckets = new Map<string, number[]>();

export function reserveBugReportDelivery(key: string, now = Date.now()) {
  const recent = (deliveryBuckets.get(key) || []).filter((time) => now - time < DELIVERY_WINDOW_MS);
  if (recent.length >= DELIVERY_MAX) {
    deliveryBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  deliveryBuckets.set(key, recent);
  return true;
}

export async function sendBugReportEmail(
  report: BugReport,
  context: BugReportEmailContext,
): Promise<BugReportDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false, reason: 'unavailable' };

  const recipient = process.env.BUG_REPORT_RECIPIENT_EMAIL?.trim() || BUG_REPORT_RECIPIENT;
  const from = process.env.BUG_REPORT_FROM_EMAIL?.trim() || 'Mila Bug Reports <onboarding@resend.dev>';
  const email = buildBugReportEmail(report, context);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `mila-bug-${randomUUID()}`,
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        tags: [{ name: 'category', value: 'bug-report' }],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error('Bug report email request failed', error);
    return { sent: false, reason: 'failed' };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const providerError = await response.text().catch(() => '');
    console.error('Bug report email rejected', response.status, providerError.slice(0, 500));
    return { sent: false, reason: 'failed' };
  }

  const result = await response.json().catch(() => ({})) as { id?: string };
  return { sent: true, id: result.id || null };
}
