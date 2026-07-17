// Proxies a line of text to the internal Piper neural-TTS service (mila-tts,
// resident on the internal Docker network) and streams back a WAV. Keeps the
// voice endpoint off the public internet — the browser only ever talks to
// same-origin /api/tts, same pattern as /api/pronounce → mila-pron. Open to
// guests (the guide chatbot and Listen page speak before sign-in); the length
// cap is the abuse guard, mirrored by the service's own MAX_CHARS.
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 15;

const TTS_URL = process.env.TTS_URL || 'http://mila-tts:8002';
const MAX_CHARS = 1200;

export async function POST(req: NextRequest) {
  let text = '';
  let lang = '';
  try {
    const body = await req.json();
    text = typeof body?.text === 'string' ? body.text : '';
    lang = typeof body?.lang === 'string' ? body.lang : '';
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  text = text.trim();
  if (!text) return NextResponse.json({ error: 'missing text' }, { status: 400 });
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  try {
    const r = await fetch(`${TTS_URL}/tts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // lang selects amy (en) or irina (ru) inside the service.
      body: JSON.stringify({ text, lang }),
    });
    if (!r.ok || !r.body) {
      return NextResponse.json({ error: 'tts service unavailable' }, { status: 502 });
    }
    // Stream the audio straight through — no buffering the whole WAV in memory.
    return new NextResponse(r.body, {
      status: 200,
      headers: {
        'content-type': r.headers.get('content-type') || 'audio/wav',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'tts service unavailable' }, { status: 502 });
  }
}
