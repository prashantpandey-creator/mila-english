# Mila Russian-English Telegram Translator

Mila Translate is a separate conversational bot. It does not reuse the PuranGPT
announcement bot or publish to the `@purangpt` channel.

## Product contract

- Translate Russian to English and English to Russian only.
- Auto-detect direction.
- Preserve tone, names, formatting, URLs, handles, emoji, and profanity.
- Use the message being replied to as context when it helps disambiguate.
- Offer natural, literal, explained, and alternate renderings from inline buttons.
- Support Telegram inline mode so a translation can be inserted into any chat.
- Do not claim universal superiority over another translator. Prove quality with a
  blind benchmark before making comparative marketing claims.

## Required environment

```dotenv
OPENAI_API_KEY=
OPENAI_TRANSLATION_MODEL=gpt-5.6
TELEGRAM_TRANSLATOR_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

Generate `TELEGRAM_WEBHOOK_SECRET` as a random 32+ character value using only
letters, numbers, underscore, and hyphen. Keep both Telegram values server-side.

## BotFather setup (user-owned step)

1. Create a new bot with `@BotFather`. Do not reuse the PuranGPT channel bot.
2. Set its name, description, profile image, and command list.
3. Run `/setinline` in BotFather and set a placeholder such as
   `Введите текст / Type text`.
4. Keep group privacy mode enabled. In groups, users should use `/translate`,
   reply to the bot, or use inline mode.
5. Put the token in the production environment; never commit it.

Suggested commands:

```text
start - Start / Начать
help - Help / Помощь
translate - Natural translation / Естественный перевод
literal - Literal translation / Дословный перевод
explain - Explain choices / Объяснить перевод
privacy - Privacy / Конфиденциальность
clear - Clear history / Очистить историю
```

## Deploy and connect

After the Mila service is deployed at its public HTTPS domain:

```bash
curl https://YOUR_DOMAIN/api/telegram/health
npm run telegram:webhook -- set https://YOUR_DOMAIN/api/telegram/webhook
npm run telegram:webhook -- status
```

The setup command sends Telegram a webhook secret. Incoming requests without
Telegram's matching `X-Telegram-Bot-Api-Secret-Token` header are rejected.

## Quality benchmark before launch

Build a frozen set of at least 200 consent-safe examples across:

- casual chat, slang, jokes, and profanity;
- business and customer-support language;
- travel and daily life;
- ambiguous pronouns and reply context;
- Russian aspect, motion verbs, cases, and English articles;
- idioms, names, numbers, URLs, formatting, and mixed-language text;
- adversarial text that tells the translator to ignore its rules.

Have two bilingual reviewers score blind outputs from Mila and Yandex on meaning,
naturalness, tone, terminology, formatting, and harmful additions. Record latency
and cost separately. Ship a comparative claim only if the measured win is clear
and reproducible.

## Current scope boundary

Version 1 translates text. Voice notes, photo OCR, saved glossaries, team termbases,
and durable history are later features and should be added only after the text
benchmark passes.
