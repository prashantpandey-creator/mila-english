import type { InlineKeyboardMarkup } from './types';

const TELEGRAM_TEXT_LIMIT = 4096;

type TelegramEnvelope<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

function botToken(): string {
  const token = process.env.TELEGRAM_TRANSLATOR_BOT_TOKEN?.trim();
  if (!token) throw new Error('TELEGRAM_TRANSLATOR_BOT_TOKEN is not configured');
  return token;
}

export async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  const envelope = (await response.json()) as TelegramEnvelope<T>;
  if (!response.ok || !envelope.ok || envelope.result === undefined) {
    throw new Error(`Telegram ${method} failed: ${envelope.description || response.statusText}`);
  }
  return envelope.result;
}

export function splitTelegramText(text: string, limit = TELEGRAM_TEXT_LIMIT): string[] {
  const clean = text.trim();
  if (clean.length <= limit) return [clean];

  const chunks: string[] = [];
  let remaining = clean;
  while (remaining.length > limit) {
    const window = remaining.slice(0, limit + 1);
    const newline = window.lastIndexOf('\n');
    const space = window.lastIndexOf(' ');
    const cut = Math.max(newline, space, Math.floor(limit * 0.7));
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function sendMessage(args: {
  chatId: number;
  text: string;
  replyToMessageId?: number;
  replyMarkup?: InlineKeyboardMarkup;
}): Promise<void> {
  const chunks = splitTelegramText(args.text);
  for (let index = 0; index < chunks.length; index += 1) {
    await callTelegram('sendMessage', {
      chat_id: args.chatId,
      text: chunks[index],
      disable_web_page_preview: true,
      ...(index === 0 && args.replyToMessageId
        ? { reply_parameters: { message_id: args.replyToMessageId, allow_sending_without_reply: true } }
        : {}),
      ...(index === chunks.length - 1 && args.replyMarkup ? { reply_markup: args.replyMarkup } : {}),
    });
  }
}

export async function editMessage(args: {
  chatId: number;
  messageId: number;
  text: string;
  replyMarkup?: InlineKeyboardMarkup;
}): Promise<void> {
  await callTelegram('editMessageText', {
    chat_id: args.chatId,
    message_id: args.messageId,
    text: splitTelegramText(args.text)[0],
    disable_web_page_preview: true,
    ...(args.replyMarkup ? { reply_markup: args.replyMarkup } : {}),
  });
}

export async function sendTyping(chatId: number): Promise<void> {
  await callTelegram('sendChatAction', { chat_id: chatId, action: 'typing' });
}

export async function answerCallbackQuery(id: string, text?: string): Promise<void> {
  await callTelegram('answerCallbackQuery', {
    callback_query_id: id,
    ...(text ? { text: text.slice(0, 200) } : {}),
  });
}

export async function answerInlineQuery(args: {
  inlineQueryId: string;
  resultId: string;
  title: string;
  description: string;
  text: string;
}): Promise<void> {
  await callTelegram('answerInlineQuery', {
    inline_query_id: args.inlineQueryId,
    is_personal: true,
    cache_time: 0,
    results: [
      {
        type: 'article',
        id: args.resultId,
        title: args.title,
        description: args.description.slice(0, 180),
        input_message_content: {
          message_text: splitTelegramText(args.text)[0],
          disable_web_page_preview: true,
        },
      },
    ],
  });
}
