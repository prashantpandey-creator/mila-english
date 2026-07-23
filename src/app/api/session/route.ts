import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { buildRealtimeSession } from '@/lib/assessment';
import { getUserPlan } from '@/lib/subscriptionStore';
import { FEATURES, planUnlocks, resolvePlan } from '@/lib/subscription';
import { realtimeModeRequiresPaid } from '@/lib/realtimeAccess';
import { prisma } from '@/lib/prisma';
import {
  releaseVoicePreview,
  reserveVoicePreview,
  type VoicePreviewReservation,
} from '@/lib/realtimePreview';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

// ── Cost floor: per-identity rate limit ─────────────────────────────────────
// Realtime audio is billed per minute; a runaway client (or abuse) could open
// unbounded sessions. This caps NEW sessions per identity per hour so cost can
// never scale faster than real use. In-memory (per instance) — resets on
// deploy, which is fine for an abuse ceiling. Tune via VOICE_REALTIME_MAX_PER_HOUR.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = Math.max(1, Number(process.env.VOICE_REALTIME_MAX_PER_HOUR || 20));
const recentCalls = new Map<string, number[]>();

function rateLimited(identity: string): boolean {
  const now = Date.now();
  const hits = (recentCalls.get(identity) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    recentCalls.set(identity, hits);
    return true;
  }
  hits.push(now);
  recentCalls.set(identity, hits);
  if (recentCalls.size > 5000) {
    for (const [key, times] of recentCalls) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) recentCalls.delete(key);
    }
  }
  return false;
}

export async function POST(req: Request) {
  const rawMode = new URL(req.url).searchParams.get('mode');
  const mode = rawMode === 'assessment' ? 'assessment'
    : rawMode === 'companion' ? 'companion'
    : rawMode === 'pia' ? 'pia'
    : rawMode === 'kids' ? 'kids'
    : 'tutor';

  const user = await authenticate(new Request(req.url, { headers: req.headers }) as any);
  // Companion preview is tied to a durable registered/explicit-guest identity.
  // Pia and the legacy kids mode remain separate guest-open products. The
  // coach and assessment also require a signed-in learner at this boundary.
  if (!user && mode !== 'pia' && mode !== 'kids') {
    return errorResponse('You must be logged in to start a voice session.', 401, 'UNAUTHORIZED');
  }

  // Microphone permission alone is not consent to send audio to OpenAI. Every
  // first-party caller adds this assertion only after its disclosure flow has
  // been accepted (or an account-scoped prior choice has been restored).
  if (req.headers.get('x-mila-openai-audio-consent') !== 'v1') {
    return errorResponse('Confirm the OpenAI audio disclosure before starting live voice.', 409, 'OPENAI_AUDIO_CONSENT_REQUIRED');
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error('OpenAI Realtime session unavailable: OPENAI_API_KEY is not configured');
    return errorResponse('Voice assessment is not configured yet.', 503, 'OPENAI_NOT_CONFIGURED');
  }

  // The identity that both the rate limit and OpenAI safety key key off of:
  // the learner when signed in, otherwise the guest device id, otherwise a
  // coarse request fingerprint.
  const identity = user?.sub
    || req.headers.get('x-device-id')
    || createHash('sha256').update(`guest:${req.headers.get('user-agent') || ''}`).digest('hex').slice(0, 24);

  if (rateLimited(identity)) {
    return errorResponse('Too many voice sessions in a short time. Please wait a moment and try again.', 429, 'RATE_LIMITED');
  }

  // Production Realtime voice is always paid, regardless of mutable server env
  // drift. Local/staging can use VOICE_REALTIME_PAID_ONLY for product testing.
  // Assessment remains outside this product paywall.
  if (realtimeModeRequiresPaid(mode)) {
    const userId = Number(user?.sub);
    const plan = Number.isSafeInteger(userId) && userId > 0 ? await getUserPlan(userId) : resolvePlan({});
    if (!planUnlocks(plan, FEATURES.REALTIME_VOICE)) {
      return errorResponse('The live voice is a Pro feature. Upgrade to talk with Mila by voice.', 402, 'VOICE_PAID_FEATURE');
    }
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/sdp')) {
    return errorResponse('Expected a WebRTC SDP offer.', 415, 'INVALID_CONTENT_TYPE');
  }

  const sdp = await req.text();
  if (!sdp.startsWith('v=0') || sdp.length > 100_000) {
    return errorResponse('The WebRTC SDP offer is invalid.', 400, 'INVALID_SDP');
  }

  // The URL is UI intent, never entitlement. Atomically consume exactly one
  // preview for this durable account before provisioning OpenAI. A failed
  // provider request releases the reservation so an outage cannot burn it.
  let previewReservation: VoicePreviewReservation | null = null;
  if (mode === 'companion') {
    const userId = Number(user?.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return errorResponse('A Mila account is required for the live preview.', 401, 'UNAUTHORIZED');
    }
    previewReservation = await reserveVoicePreview(prisma.user, userId);
    if (!previewReservation) {
      return errorResponse('Your live voice preview has already been used.', 402, 'VOICE_PREVIEW_USED');
    }
  }

  const releasePreviewReservation = async () => {
    const reservation = previewReservation;
    if (!reservation) return;
    try {
      await releaseVoicePreview(prisma.user, reservation);
    } catch (error) {
      console.error('Could not release failed live voice preview reservation', error);
    }
  };

  const form = new FormData();
  form.set('sdp', sdp);
  form.set('session', JSON.stringify(buildRealtimeSession(mode)));

  const safetyIdentifier = createHash('sha256')
    .update(`mila-realtime:${identity}`)
    .digest('hex');

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'OpenAI-Safety-Identifier': safetyIdentifier,
      },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });

    const body = await response.text();
    if (!response.ok) {
      await releasePreviewReservation();
      console.error('OpenAI Realtime session failed', response.status, body);
      return errorResponse('OpenAI could not start the voice assessment.', 502, 'OPENAI_SESSION_FAILED');
    }

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/sdp' },
    });
  } catch (error) {
    await releasePreviewReservation();
    console.error('OpenAI Realtime session request failed', error);
    return errorResponse('The voice service is temporarily unavailable.', 502, 'OPENAI_UNAVAILABLE');
  }
}
