import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 75;

const ASR_URL = process.env.ASR_URL || 'http://mila-asr:8001';
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  const requestedLanguage = form?.get('language');
  const language = requestedLanguage === 'ru' || requestedLanguage === 'auto' ? requestedLanguage : 'en';
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: 'Missing audio' }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio exceeds 8 MB' }, { status: 413 });
  }

  const forwarded = new FormData();
  forwarded.append('audio', audio, audio.name || 'assessment.webm');
  forwarded.append('language', language);

  try {
    const response = await fetch(`${ASR_URL}/transcribe`, {
      method: 'POST',
      body: forwarded,
      // whisper-small on CPU runs ~2x realtime on this box (measured live:
      // 5.84s of speech took 10-22s depending on CPU quota). A full 20s
      // recording (localTranscription.ts MAX_MS) can approach 40s on a
      // single call alone, before counting a mid-speech partial that may
      // already be queued behind the ASR service's own request semaphore.
      // 40s was clipping real requests (TimeoutError, prod, 2026-08-26) —
      // widened for headroom.
      signal: AbortSignal.timeout(70_000),
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Local ASR service unavailable', error);
    return NextResponse.json({ error: 'Local transcription service unavailable' }, { status: 502 });
  }
}
