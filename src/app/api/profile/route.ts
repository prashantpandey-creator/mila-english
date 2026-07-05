// The learner's synthesized profile. GET reads the cached one; POST re-synthesizes
// from the latest per-phoneme state. Gated behind the session, like the other routes.
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { generateLearnerProfile, readLearnerProfile } from '@/lib/learnerProfile';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profile = await readLearnerProfile(Number(user.sub));
  return NextResponse.json(profile ?? { strengths: [], weak_summary: '', learner_arc: '', focus: [] });
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profile = await generateLearnerProfile(Number(user.sub));
  return NextResponse.json(profile);
}
