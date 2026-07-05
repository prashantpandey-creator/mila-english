// Proxies a recorded clip + reference to the internal phoneme-scoring service
// (mila-pron, resident on the coolify network). Keeps the model endpoint off the
// public internet — the browser only ever talks to same-origin /api/pronounce.
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PRON_URL = process.env.PRON_URL || 'http://mila-pron:8000';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const audio = form.get('audio');
  const reference = form.get('reference');
  if (!(audio instanceof File) || typeof reference !== 'string') {
    return NextResponse.json({ error: 'missing audio or reference' }, { status: 400 });
  }
  const fwd = new FormData();
  fwd.append('audio', audio, 'a.webm');
  fwd.append('reference', reference);
  try {
    const r = await fetch(`${PRON_URL}/pronounce`, { method: 'POST', body: fwd });
    const body = await r.text();
    return new NextResponse(body, { status: r.status, headers: { 'content-type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'scoring service unavailable' }, { status: 502 });
  }
}
