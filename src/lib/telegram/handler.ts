import { createHash } from 'node:crypto';
import {
  answerCallbackQuery,
  answerInlineQuery,
  editMessage,
  sendMessage,
  sendTyping,
} from './api';
import { formatTranslation, translateText, type TranslationStyle } from './translate';
import type {
  InlineKeyboardMarkup,
  TelegramCallbackQuery,
  TelegramInlineQuery,
  TelegramMessage,
  TelegramUpdate,
} from './types';

const ACTIONS: Record<string, TranslationStyle> = {
  'tr:n': 'natural',
  'tr:l': 'literal',
  'tr:e': 'explain',
  'tr:a': 'alternate',
};

const TRANSLATION_KEYBOARD: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '✨ Natural', callback_data: 'tr:n' },
      { text: '📐 Literal', callback_data: 'tr:l' },
    ],
    [
      { text: '💡 Explain', callback_data: 'tr:e' },
      { text: '🔄 Another', callback_data: 'tr:a' },
    ],
  ],
};

const START_TEXT = `Mila Translate 🇷🇺 ⇄ 🇬🇧

Пришлите текст — я автоматически переведу русский на английский или английский на русский.

Send text and I will automatically translate Russian to English or English to Russian.

Commands:
/literal text — closer to the original structure
/explain text — translate and explain key choices
/privacy — how message data is handled

In groups, use /translate text, reply to the bot, or enable inline mode with @BotFather and type @your_bot text in any chat.`;

const PRIVACY_TEXT = `Privacy / Конфиденциальность

Messages sent to this bot are processed by Telegram, Mila's server, and the configured AI translation provider. Do not send passwords, banking details, private keys, medical records, or other highly sensitive information.

Сообщения обрабатываются Telegram, сервером Mila и настроенным ИИ-провайдером перевода. Не отправляйте пароли, банковские данные, закрытые ключи, медицинские документы и другую особо конфиденциальную информацию.

The bot does not need a Mila account and does not intentionally store a conversation history.`;

const seenUpdates = new Set<number>();
const rateWindows = new Map<number, number[]>();

function rememberUpdate(updateId: number): boolean {
  if (seenUpdates.has(updateId)) return false;
  seenUpdates.add(updateId);
  if (seenUpdates.size > 2_000) {
    const oldest = seenUpdates.values().next().value;
    if (typeof oldest === 'number') seenUpdates.delete(oldest);
  }
  return true;
}

function withinRateLimit(userId: number): boolean {
  const now = Date.now();
  const recent = (rateWindows.get(userId) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 20) {
    rateWindows.set(userId, recent);
    return false;
  }
  recent.push(now);
  rateWindows.set(userId, recent);
  if (rateWindows.size > 10_000) rateWindows.clear();
  return true;
}

function parseCommand(text: string): { command?: string; payload: string } {
  if (!text.startsWith('/')) return { payload: text };
  const firstSpace = text.indexOf(' ');
  const token = (firstSpace === -1 ? text : text.slice(0, firstSpace)).toLowerCase();
  const command = token.slice(1).split('@')[0];
  return { command, payload: firstSpace === -1 ? '' : text.slice(firstSpace + 1).trim() };
}

function replyContext(message: TelegramMessage): string | undefined {
  const replied = message.reply_to_message;
  if (!replied?.text) return undefined;
  if (replied.from?.is_bot && replied.reply_to_message?.text) {
    return `Earlier source: ${replied.reply_to_message.text}\nEarlier translation: ${replied.text}`;
  }
  return replied.text;
}

async function translateMessage(message: TelegramMessage, text: string, style: TranslationStyle) {
  const userId = message.from?.id;
  if (!userId) return;
  if (!withinRateLimit(userId)) {
    await sendMessage({
      chatId: message.chat.id,
      replyToMessageId: message.message_id,
      text: 'Слишком много запросов. Подождите минуту. / Too many requests. Please wait a minute.',
    });
    return;
  }

  await sendTyping(message.chat.id).catch(() => undefined);
  try {
    const result = await translateText({
      text,
      style,
      replyContext: replyContext(message),
      userId: String(userId),
    });
    await sendMessage({
      chatId: message.chat.id,
      replyToMessageId: message.message_id,
      text: formatTranslation(result, style),
      replyMarkup: result.status === 'ok' ? TRANSLATION_KEYBOARD : undefined,
    });
  } catch (error) {
    console.error('Telegram translation failed', error);
    await sendMessage({
      chatId: message.chat.id,
      replyToMessageId: message.message_id,
      text: 'Перевод сейчас недоступен. Попробуйте ещё раз. / Translation is temporarily unavailable. Please try again.',
    });
  }
}

async function handleMessage(message: TelegramMessage) {
  const text = message.text?.trim();
  if (!text || !message.from || message.from.is_bot) return;

  const { command, payload } = parseCommand(text);
  if (command === 'start' || command === 'help') {
    await sendMessage({ chatId: message.chat.id, text: START_TEXT, replyToMessageId: message.message_id });
    return;
  }
  if (command === 'privacy') {
    await sendMessage({ chatId: message.chat.id, text: PRIVACY_TEXT, replyToMessageId: message.message_id });
    return;
  }
  if (command === 'clear') {
    await sendMessage({
      chatId: message.chat.id,
      text: 'История не хранится: очищать нечего. / No conversation history is stored.',
      replyToMessageId: message.message_id,
    });
    return;
  }

  let style: TranslationStyle = 'natural';
  let source = text;
  if (command === 'literal') {
    style = 'literal';
    source = payload;
  } else if (command === 'explain') {
    style = 'explain';
    source = payload;
  } else if (command === 'translate' || command === 'tr') {
    source = payload;
  } else if (command) {
    await sendMessage({ chatId: message.chat.id, text: START_TEXT, replyToMessageId: message.message_id });
    return;
  } else if (message.chat.type !== 'private' && !message.reply_to_message?.from?.is_bot) {
    return;
  }

  if (!source) {
    await sendMessage({
      chatId: message.chat.id,
      text: 'Добавьте текст после команды. / Add text after the command.',
      replyToMessageId: message.message_id,
    });
    return;
  }
  await translateMessage(message, source, style);
}

async function handleCallback(query: TelegramCallbackQuery) {
  const style = query.data ? ACTIONS[query.data] : undefined;
  const botMessage = query.message;
  const sourceMessage = botMessage?.reply_to_message;
  if (!style || !botMessage || !sourceMessage?.text) {
    await answerCallbackQuery(query.id, 'Original text is no longer available.');
    return;
  }
  if (!withinRateLimit(query.from.id)) {
    await answerCallbackQuery(query.id, 'Please wait a minute.');
    return;
  }

  await answerCallbackQuery(query.id, 'Translating…');
  try {
    const parsed = parseCommand(sourceMessage.text);
    const source = parsed.payload || sourceMessage.text;
    const result = await translateText({
      text: source,
      style,
      replyContext: replyContext(sourceMessage),
      userId: String(query.from.id),
    });
    await editMessage({
      chatId: botMessage.chat.id,
      messageId: botMessage.message_id,
      text: formatTranslation(result, style),
      replyMarkup: TRANSLATION_KEYBOARD,
    });
  } catch (error) {
    console.error('Telegram callback translation failed', error);
    await answerCallbackQuery(query.id, 'Translation is temporarily unavailable.').catch(() => undefined);
  }
}

async function handleInlineQuery(query: TelegramInlineQuery) {
  const source = query.query.trim();
  if (!source || !withinRateLimit(query.from.id)) {
    await answerInlineQuery({
      inlineQueryId: query.id,
      resultId: 'empty',
      title: 'Mila Translate 🇷🇺 ⇄ 🇬🇧',
      description: 'Type Russian or English text',
      text: 'Type Russian or English text after the bot name.',
    });
    return;
  }

  try {
    const result = await translateText({ text: source, userId: String(query.from.id) });
    const formatted = formatTranslation(result, 'natural');
    const id = createHash('sha256').update(`${query.id}:${source}`).digest('hex').slice(0, 32);
    await answerInlineQuery({
      inlineQueryId: query.id,
      resultId: id,
      title: result.target_language === 'ru' ? 'Перевести на русский' : 'Translate to English',
      description: result.translation,
      text: formatted,
    });
  } catch (error) {
    console.error('Telegram inline translation failed', error);
    await answerInlineQuery({
      inlineQueryId: query.id,
      resultId: 'error',
      title: 'Translation unavailable',
      description: 'Please try again',
      text: 'Translation is temporarily unavailable. Please try again.',
    });
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (!rememberUpdate(update.update_id)) return;
  if (update.message) await handleMessage(update.message);
  else if (update.callback_query) await handleCallback(update.callback_query);
  else if (update.inline_query) await handleInlineQuery(update.inline_query);
}
