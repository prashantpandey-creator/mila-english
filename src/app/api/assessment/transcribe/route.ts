import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 45;

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
      signal: AbortSignal.timeout(40_000),
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
