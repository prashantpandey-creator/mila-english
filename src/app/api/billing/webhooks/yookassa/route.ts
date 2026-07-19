import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { processYooKassaEvent } from '@/lib/billingStore';
import { consumeAuthAttempt, requestIdentity } from '@/lib/authRateLimit';
import { paymentIdFromYooKassaEvent } from '@/lib/yookassa';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rate = consumeAuthAttempt(`yookassa-webhook:${requestIdentity(request)}`, { limit: 120, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many callbacks' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }
  const body = await request.json().catch(() => null);
  const eventType = typeof body?.event === 'string' ? body.event : '';
  if (!['payment.succeeded', 'payment.canceled', 'refund.succeeded'].includes(eventType)) {
    return NextResponse.json({ received: true, ignored: true });
  }
  const object = body?.object;
  const providerPaymentId = paymentIdFromYooKassaEvent(eventType, object);

  if (!providerPaymentId) {
    // YooKassa expects 200 for events the application intentionally ignores.
    return NextResponse.json({ received: true, ignored: true });
  }

  // Payment IDs identify payment events; refund objects have their own stable
  // ID. Provider retries therefore converge on one row without trusting a
  // caller-controlled timestamp or status as the event identity.
  const providerEventIdentity = typeof object?.id === 'string' ? object.id : providerPaymentId;
  const eventKey = createHash('sha256').update(`${eventType}:${providerEventIdentity}`).digest('hex');

  try {
    // The callback body is never trusted as payment proof. Reconciliation
    // fetches this payment directly from YooKassa using Mila's server key and
    // validates amount, currency, product, and local order metadata.
    const event = await processYooKassaEvent({ eventType, providerPaymentId, eventKey });
    return NextResponse.json({ received: true, ...(event ? {} : { ignored: true }) });
  } catch (error) {
    console.error('YooKassa webhook reconciliation failed', error);
    return NextResponse.json({ error: 'Could not reconcile payment' }, { status: 503 });
  }
}
