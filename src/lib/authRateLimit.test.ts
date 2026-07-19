import assert from 'node:assert/strict';
import test from 'node:test';
import { consumeAuthAttempt, requestIdentity } from './authRateLimit';

test('request identity does not trust the first forwarded value', () => {
  const request = new Request('https://mila.local', {
    headers: {
      'x-forwarded-for': 'spoofed, 203.0.113.7',
      'x-real-ip': 'client-controlled-value',
    },
  });
  assert.equal(requestIdentity(request), '203.0.113.7');
});

test('rate buckets fail closed at their configured limit', () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.equal(consumeAuthAttempt(key, { limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(consumeAuthAttempt(key, { limit: 2, windowMs: 60_000 }).allowed, true);
  const blocked = consumeAuthAttempt(key, { limit: 2, windowMs: 60_000 });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test('namespace capacity never evicts an active security bucket', () => {
  const namespace = `capacity-${Date.now()}-${Math.random()}`;
  const now = 5_000_000;
  const target = `${namespace}:target`;
  assert.equal(consumeAuthAttempt(target, { limit: 1, windowMs: 60_000 }, now).allowed, true);
  for (let index = 0; index < 1_999; index += 1) {
    assert.equal(consumeAuthAttempt(`${namespace}:churn-${index}`, { limit: 2, windowMs: 60_000 }, now).allowed, true);
  }
  assert.equal(consumeAuthAttempt(`${namespace}:overflow`, { limit: 2, windowMs: 60_000 }, now).allowed, false);
  assert.equal(consumeAuthAttempt(target, { limit: 1, windowMs: 60_000 }, now).allowed, false);
});
