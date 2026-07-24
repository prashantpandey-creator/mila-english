import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendGiaGuestVoiceTurn,
  consumeGiaGuestVoiceHandoff,
  GIA_GUEST_VOICE_HANDOFF_KEY_PREFIX,
} from './giaGuestHandoff';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

test('guest voice turns cross into text chat once without durable storage', () => {
  const storage = memoryStorage();
  const token = 'handoff-test-1234';

  appendGiaGuestVoiceTurn(storage, token, {
    user: 'I had a difficult day.',
    assistant: 'I am here. Tell me what happened.',
  });

  assert.deepEqual(consumeGiaGuestVoiceHandoff(storage, token).map(({ role, content }) => ({ role, content })), [
    { role: 'user', content: 'I had a difficult day.' },
    { role: 'assistant', content: 'I am here. Tell me what happened.' },
  ]);
  assert.equal(storage.getItem(`${GIA_GUEST_VOICE_HANDOFF_KEY_PREFIX}:${token}`), null);
  assert.deepEqual(consumeGiaGuestVoiceHandoff(storage, token), []);
});

test('malformed handoff data fails closed', () => {
  const storage = memoryStorage();
  const token = 'handoff-test-5678';
  storage.setItem(`${GIA_GUEST_VOICE_HANDOFF_KEY_PREFIX}:${token}`, '{not-json');

  assert.deepEqual(consumeGiaGuestVoiceHandoff(storage, token), []);
  assert.equal(storage.getItem(`${GIA_GUEST_VOICE_HANDOFF_KEY_PREFIX}:${token}`), null);
  assert.deepEqual(consumeGiaGuestVoiceHandoff(storage, '../wrong'), []);
});
