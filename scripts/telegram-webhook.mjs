#!/usr/bin/env node

const token = process.env.TELEGRAM_TRANSLATOR_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const [command = 'status', rawUrl] = process.argv.slice(2);

if (!token) {
  console.error('TELEGRAM_TRANSLATOR_BOT_TOKEN is required.');
  process.exit(1);
}

async function telegram(method, body = {}) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || `${method} failed (${response.status})`);
  }
  return payload.result;
}

try {
  if (command === 'status') {
    const [bot, webhook] = await Promise.all([telegram('getMe'), telegram('getWebhookInfo')]);
    console.log(JSON.stringify({
      bot: { id: bot.id, username: bot.username, name: bot.first_name },
      webhook: {
        url: webhook.url,
        pending_update_count: webhook.pending_update_count,
        last_error_date: webhook.last_error_date,
        last_error_message: webhook.last_error_message,
        allowed_updates: webhook.allowed_updates,
      },
    }, null, 2));
  } else if (command === 'set') {
    if (!secret) throw new Error('TELEGRAM_WEBHOOK_SECRET is required when setting the webhook.');
    if (!rawUrl) throw new Error('Usage: npm run telegram:webhook -- set https://example.com/api/telegram/webhook');
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') throw new Error('Telegram webhooks require an HTTPS URL.');
    const result = await telegram('setWebhook', {
      url: url.toString(),
      secret_token: secret,
      allowed_updates: ['message', 'callback_query', 'inline_query'],
      max_connections: 20,
    });
    console.log(JSON.stringify({ ok: result, webhook: url.toString() }, null, 2));
  } else if (command === 'delete') {
    const result = await telegram('deleteWebhook', { drop_pending_updates: false });
    console.log(JSON.stringify({ ok: result }, null, 2));
  } else {
    throw new Error('Command must be status, set, or delete.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
