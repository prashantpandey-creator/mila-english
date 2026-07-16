import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { buildRealtimeSession } from '@/lib/assessment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: Request) {
  const user = await authenticate(new Request(req.url, { headers: req.headers }) as any);
  if (!user) {
    return errorResponse('You must be logged in to start a voice session.', 401, 'UNAUTHORIZED');
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error('OpenAI Realtime session unavailable: OPENAI_API_KEY is not configured');
    return errorResponse('Voice assessment is not configured yet.', 503, 'OPENAI_NOT_CONFIGURED');
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/sdp')) {
    return errorResponse('Expected a WebRTC SDP offer.', 415, 'INVALID_CONTENT_TYPE');
  }

  const sdp = await req.text();
  if (!sdp.startsWith('v=0') || sdp.length > 100_000) {
    return errorResponse('The WebRTC SDP offer is invalid.', 400, 'INVALID_SDP');
  }

  const mode = new URL(req.url).searchParams.get('mode') === 'assessment' ? 'assessment' : 'tutor';
  const form = new FormData();
  form.set('sdp', sdp);
  form.set('session', JSON.stringify(buildRealtimeSession(mode)));

  const safetyIdentifier = createHash('sha256')
    .update(`mila-realtime:${user.sub}`)
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
      console.error('OpenAI Realtime session failed', response.status, body);
      return errorResponse('OpenAI could not start the voice assessment.', 502, 'OPENAI_SESSION_FAILED');
    }

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/sdp' },
    });
  } catch (error) {
    console.error('OpenAI Realtime session request failed', error);
    return errorResponse('The voice service is temporarily unavailable.', 502, 'OPENAI_UNAVAILABLE');
  }
}
