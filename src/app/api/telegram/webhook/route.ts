import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram/handler';
import type { TelegramUpdate } from '@/lib/telegram/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

function validSecret(received: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!validSecret(request.headers.get('x-telegram-bot-api-secret-token'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    if (!Number.isInteger(update.update_id)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await handleTelegramUpdate(update);
  } catch (error) {
    // Return 200 so Telegram does not repeatedly deliver a permanently bad update.
    console.error('Telegram webhook update failed', error);
  }

  return NextResponse.json({ ok: true });
}
