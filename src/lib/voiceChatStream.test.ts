import assert from 'node:assert';
import { createDataStreamParser } from './voiceChatStream';

// Text parts split across arbitrary chunk boundaries reassemble correctly.
{
  const parser = createDataStreamParser();
  const texts: string[] = [];
  for (const chunk of ['0:"Hel', 'lo"\n0:" wor', 'ld"\n']) {
    const parsed = parser.push(chunk);
    texts.push(...parsed.texts);
    assert.strictEqual(parsed.error, null);
  }
  assert.deepStrictEqual(texts, ['Hello', ' world']);
}

// Non-text parts are ignored; error parts surface.
{
  const parser = createDataStreamParser();
  const first = parser.push('e:{"finishReason":"stop"}\nd:{"usage":1}\n0:"ok"\n');
  assert.deepStrictEqual(first.texts, ['ok']);
  assert.strictEqual(first.error, null);
  const second = parser.push('3:"model exploded"\n');
  assert.deepStrictEqual(second.texts, []);
  assert.strictEqual(second.error, 'model exploded');
}

// A line that never terminates yields nothing (no partial-JSON crashes).
{
  const parser = createDataStreamParser();
  const parsed = parser.push('0:"never finished');
  assert.deepStrictEqual(parsed.texts, []);
  assert.strictEqual(parsed.error, null);
}

// Malformed JSON on a completed line is skipped, later lines still parse.
{
  const parser = createDataStreamParser();
  const parsed = parser.push('0:not-json\n0:"fine"\n');
  assert.deepStrictEqual(parsed.texts, ['fine']);
}

// Empty text parts pass through (the route sends 0:"" for a skipped draft).
{
  const parser = createDataStreamParser();
  const parsed = parser.push('0:""\n');
  assert.deepStrictEqual(parsed.texts, ['']);
}

console.log('voiceChatStream parser: all assertions pass');
