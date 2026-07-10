// Proxies a recorded clip + reference to the internal phoneme-scoring service
// (mila-pron, resident on the internal Docker network). Keeps the model endpoint
// off the public internet — the browser only ever talks to same-origin /api/pronounce.
// When the caller is signed in, each scored attempt also feeds the learner model
// (PhonemeStat upserts + ELO ability) — best-effort, never blocks the response.
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { recordAttempt } from '@/lib/attempt';

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

    // Feed the learner model (signed-in users only; guests score anonymously).
    if (r.ok) {
      const user = await authenticate(req).catch(() => null);
      const uid = user ? Number(user.sub) : NaN;
      if (Number.isFinite(uid)) {
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed?.words)) void recordAttempt(uid, parsed);
        } catch { /* body wasn't JSON — nothing to record */ }
      }
    }

    return new NextResponse(body, { status: r.status, headers: { 'content-type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'scoring service unavailable' }, { status: 502 });
  }
}
