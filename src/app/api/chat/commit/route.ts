import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { saveCompanionTurn } from '@/lib/companionStore';
import { isGiaHostname, isMiaHostname } from '@/lib/productHosts';

// Persists a committed speculative voice draft. Speculative /api/chat calls
// deliberately skip saveCompanionTurn (they answer partial transcripts); when
// the final transcript matches the draft, the client commits the turn here.
export async function POST(request: NextRequest) {
  if (isMiaHostname(request.headers.get('host'))) {
    return NextResponse.json({ error: 'Mia does not use companion history.' }, { status: 403 });
  }
  const product = isGiaHostname(request.headers.get('host')) ? 'gia' : 'mila';
  const user = await authenticate(request);
  const userId = Number(user?.sub);
  if (!user || !Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const userText = typeof payload?.user === 'string' ? payload.user.trim().slice(0, 4000) : '';
  const assistantText = typeof payload?.assistant === 'string' ? payload.assistant.trim().slice(0, 600) : '';
  if (!userText || !assistantText) {
    return NextResponse.json({ error: 'user and assistant text are required.' }, { status: 400 });
  }

  const locale = payload?.lang === 'ru' ? 'ru' : 'en';
  await saveCompanionTurn(userId, userText, assistantText, {
    pathname: '/darshan',
    locale,
    surface: 'Darshan voice conversation',
    product,
  });
  return NextResponse.json({ ok: true });
}
