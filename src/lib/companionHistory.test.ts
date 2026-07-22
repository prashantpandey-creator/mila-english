import test from 'node:test';
import assert from 'node:assert/strict';
import { selectHistoryForModel, type ModelHistoryMessage } from './companionHistory';

test('guest history comes from the client transcript, never the database', () => {
  const result = selectHistoryForModel({
    isGuest: true,
    incomingMessages: [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'how are you' }, // freshly-sent turn — dropped, caller re-adds it
    ],
    // A leaked prior guest's stored thread must be completely ignored.
    storedMessages: [{ role: 'user', content: 'SECRET FROM A DIFFERENT PERSON' }],
    spoken: false,
  });
  assert.deepEqual(result, [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ]);
});

test('guest with only the freshly-sent turn has no prior context', () => {
  assert.deepEqual(
    selectHistoryForModel({
      isGuest: true,
      incomingMessages: [{ role: 'user', content: 'hi' }],
      storedMessages: [],
      spoken: false,
    }),
    [],
  );
});

test('guest with an empty transcript yields empty context', () => {
  assert.deepEqual(
    selectHistoryForModel({ isGuest: true, incomingMessages: [], storedMessages: [], spoken: false }),
    [],
  );
});

test('registered learner history comes from the stored thread, not the client', () => {
  const result = selectHistoryForModel({
    isGuest: false,
    incomingMessages: [{ role: 'user', content: 'ignored client-supplied turn' }],
    storedMessages: [
      { role: 'user', content: 'earlier' },
      { role: 'system', content: 'drop this non-conversational role' },
      { role: 'assistant', content: 'reply' },
    ],
    spoken: false,
  });
  assert.deepEqual(result, [
    { role: 'user', content: 'earlier' },
    { role: 'assistant', content: 'reply' },
  ]);
});

test('spoken turns clamp content length and cap the number of prior turns', () => {
  const long = 'x'.repeat(1000);
  const many: ModelHistoryMessage[] = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: long,
  }));
  const result = selectHistoryForModel({
    isGuest: true,
    incomingMessages: [...many, { role: 'user', content: 'now' }],
    storedMessages: [],
    spoken: true,
  });
  assert.equal(result.length, 4);
  assert.ok(result.every((message) => message.content.length === 600));
});
