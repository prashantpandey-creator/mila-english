import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configuration = {
    bot_token: Boolean(process.env.TELEGRAM_TRANSLATOR_BOT_TOKEN?.trim()),
    webhook_secret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim()),
    openai_key: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: process.env.OPENAI_TRANSLATION_MODEL?.trim() || 'gpt-5.6',
  };
  const ready = configuration.bot_token && configuration.webhook_secret && configuration.openai_key;
  return NextResponse.json(
    { service: 'mila-telegram-translator', ready, configuration },
    { status: ready ? 200 : 503 },
  );
}
