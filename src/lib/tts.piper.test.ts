// Unit test for the Piper gating decision — the one deterministic seam in the
// otherwise DOM-bound ttsSpeak. Run: npx tsx src/lib/tts.piper.test.ts
// (matches the repo's node:assert test convention — see tts.streaming.test.ts).
import assert from 'node:assert';

async function main() {
  // shouldUsePiper only reads text + lang (via spokenLocaleForText) — no window,
  // no fetch — so it imports and runs bare.
  const { shouldUsePiper } = await import('./tts');

  // English content on English locales → Piper (the warm US voice).
  assert.strictEqual(shouldUsePiper('Great job, that was very clear.', 'en-US'), true, 'en-US English → Piper');
  assert.strictEqual(shouldUsePiper('Say the word again.', 'en-GB'), true, 'en-GB English → Piper');
  assert.strictEqual(shouldUsePiper('Repeat after me.', 'en-IN'), true, 'en-IN English → Piper');

  // Russian is amy's blind spot — must fall through to the browser voice.
  assert.strictEqual(shouldUsePiper('Теперь попробуем ещё раз.', 'ru-RU'), false, 'ru-RU → browser');

  // A Russian string mis-tagged as English must still be rejected (content wins).
  assert.strictEqual(shouldUsePiper('Привет, как дела сегодня утром?', 'en-US'), false, 'Cyrillic under en-US → browser');

  // Non-English locales never take the English voice.
  assert.strictEqual(shouldUsePiper('Bonjour tout le monde', 'fr-FR'), false, 'fr-FR → browser');

  // Empty / whitespace speaks nothing through either path.
  assert.strictEqual(shouldUsePiper('', 'en-US'), false, 'empty → false');
  assert.strictEqual(shouldUsePiper('   ', 'en-US'), false, 'whitespace → false');

  // A short English line with an incidental accented char is still English.
  assert.strictEqual(shouldUsePiper('Café is a common English word.', 'en-US'), true, 'mostly-Latin → Piper');

  console.log('tts.piper.test.ts — all assertions passed');
}

main().catch((err) => { console.error(err); process.exit(1); });
