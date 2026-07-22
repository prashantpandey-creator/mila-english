import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { clearCompanionConversation, listCompanionMessages, type CompanionHistoryScope } from '@/lib/companionStore';

function authenticatedUserId(user: { sub: string } | null): number | null {
  if (!user) return null;
  const userId = Number(user.sub);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}

export async function GET(request: NextRequest) {
  const session = await authenticate(request);
  const userId = authenticatedUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Guests never have durable, server-owned history. Returning empty here (in
  // addition to the store-level guard) guarantees a guest browser session — or
  // a shared device that inherited a guest cookie — can never read a prior
  // guest's saved conversation.
  if (session?.accountType === 'guest') return NextResponse.json({ messages: [] });

  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 20);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(Math.floor(requestedLimit), 80)) : 20;
  const requestedScope = request.nextUrl.searchParams.get('scope');
  const scope: CompanionHistoryScope = requestedScope === 'conversation' || requestedScope === 'practice'
    ? requestedScope
    : 'all';
  const messages = await listCompanionMessages(userId, limit, scope);

  return NextResponse.json({
    messages: messages.map((message) => ({
      id: `companion-${message.id}`,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const userId = authenticatedUserId(await authenticate(request));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await clearCompanionConversation(userId);
  return NextResponse.json({ ok: true });
}
