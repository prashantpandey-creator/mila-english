import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { clearCompanionConversation, listCompanionMessages } from '@/lib/companionStore';

function authenticatedUserId(user: { sub: string } | null): number | null {
  if (!user) return null;
  const userId = Number(user.sub);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}

export async function GET(request: NextRequest) {
  const userId = authenticatedUserId(await authenticate(request));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 20);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(Math.floor(requestedLimit), 80)) : 20;
  const messages = await listCompanionMessages(userId, limit);

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
