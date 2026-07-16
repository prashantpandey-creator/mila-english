import assert from 'node:assert';
import { spokenLocaleForText, takeStreamingTtsChunk } from './tts';

assert.strictEqual(takeStreamingTtsChunk('Only three words'), null);
assert.deepStrictEqual(
  takeStreamingTtsChunk('You said it clearly. The next sentence is still arriving'),
  { text: 'You said it clearly.', consumed: 20 },
);
assert.strictEqual(spokenLocaleForText('Tell me about yourself.'), 'en-US');
assert.strictEqual(spokenLocaleForText('Расскажи немного о себе.'), 'ru-RU');
assert.strictEqual(spokenLocaleForText('123', 'ru-RU'), 'ru-RU');
assert.deepStrictEqual(
  takeStreamingTtsChunk('One two three four five six seven eight, more text'),
  { text: 'One two three four five six seven eight,', consumed: 40 },
);
assert.deepStrictEqual(
  takeStreamingTtsChunk('One two three four five six seven eight nine ten eleven twelve '),
  { text: 'One two three four five six seven eight nine ten', consumed: 48 },
);
assert.deepStrictEqual(
  takeStreamingTtsChunk('Short final phrase', true),
  { text: 'Short final phrase', consumed: 18 },
);

console.log('streaming TTS chunking: all assertions pass');
