import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { bugReportSchema } from '@/lib/bugReport';
import { sendBugReportEmail } from '@/lib/sendBugReportEmail';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 20_000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5;
const rateBuckets = new Map<string, number[]>();

function rateKey(request: NextRequest, accountId?: string) {
  if (accountId) return `user:${accountId}`;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `ip:${forwarded || request.headers.get('x-real-ip') || 'unknown'}`;
}

function takeRateSlot(key: string, now = Date.now()) {
  const recent = (rateBuckets.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  if (rateBuckets.size > 1000) {
    for (const [bucketKey, entries] of rateBuckets) {
      if (!entries.some((time) => now - time < RATE_WINDOW_MS)) rateBuckets.delete(bucketKey);
    }
  }
  return true;
}

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'report_too_large' }, { status: 413 });
  }

  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: raw ? 'report_too_large' : 'invalid_report' }, { status: raw ? 413 : 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_report' }, { status: 400 });
  }

  const parsed = bugReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_report' }, { status: 400 });
  }

  // Bots commonly fill this visually hidden field. Return a quiet success so
  // the endpoint does not become an email amplifier.
  if (parsed.data.website) return NextResponse.json({ sent: true });

  const user = await authenticate(request);
  if (!takeRateSlot(rateKey(request, user?.sub))) {
    return NextResponse.json({ error: 'rate_limited' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(RATE_WINDOW_MS / 1000)) },
    });
  }

  const delivery = await sendBugReportEmail(parsed.data, {
    receivedAt: new Date().toISOString(),
    requestUserAgent: request.headers.get('user-agent') || undefined,
  });
  if (!delivery.sent) {
    return NextResponse.json({
      error: delivery.reason === 'unavailable' ? 'email_unavailable' : 'email_failed',
      fallback: 'mailto',
    }, { status: delivery.reason === 'unavailable' ? 503 : 502 });
  }
  return NextResponse.json(delivery);
}
