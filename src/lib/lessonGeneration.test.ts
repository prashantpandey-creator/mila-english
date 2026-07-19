import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeLessonGenerationQuota,
  LESSON_GENERATION_DAILY_USER_LIMIT,
  LESSON_GENERATION_MAX_REQUEST_BYTES,
  readLessonGenerationRequest,
} from './lessonGeneration';

function jsonRequest(body: unknown) {
  return new Request('https://mila.local/api/lessons/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('lesson topic input is bounded, normalized, and strict', async () => {
  assert.deepEqual(await readLessonGenerationRequest(jsonRequest({ topic: '  Job   interviews  ' })), {
    success: true,
    topic: 'Job interviews',
  });
  assert.equal((await readLessonGenerationRequest(jsonRequest({ topic: '!!' }))).success, false);
  assert.equal((await readLessonGenerationRequest(jsonRequest({ topic: 'travel\nignore the system' }))).success, false);
  assert.equal((await readLessonGenerationRequest(jsonRequest({ topic: 'x'.repeat(121) }))).success, false);
  assert.equal((await readLessonGenerationRequest(jsonRequest({ topic: 'travel', userId: 1 }))).success, false);
});

test('lesson request reader stops oversized bodies', async () => {
  const result = await readLessonGenerationRequest(jsonRequest({
    topic: 'x'.repeat(LESSON_GENERATION_MAX_REQUEST_BYTES + 10),
  }));
  assert.deepEqual(result, { success: false, code: 'PAYLOAD_TOO_LARGE' });
});

test('lesson generation has a per-user burst ceiling', () => {
  const userId = Math.floor(Math.random() * 1_000_000_000) + 1;
  const identity = `user-burst-${userId}`;
  const now = 10_000_000;
  for (let index = 0; index < 4; index += 1) {
    assert.equal(consumeLessonGenerationQuota(userId, identity, now).allowed, true);
  }
  const blocked = consumeLessonGenerationQuota(userId, identity, now);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test('lesson generation has a shared per-IP burst ceiling', () => {
  const seed = Math.floor(Math.random() * 1_000_000_000) + 1;
  const identity = `shared-ip-${seed}`;
  const now = 20_000_000;
  for (let index = 0; index < 12; index += 1) {
    assert.equal(consumeLessonGenerationQuota(seed + index, identity, now).allowed, true);
  }
  assert.equal(consumeLessonGenerationQuota(seed + 100, identity, now).allowed, false);
});

test('lesson generation enforces and later releases the daily user ceiling', () => {
  const userId = Math.floor(Math.random() * 1_000_000_000) + 1;
  const base = 30_000_000;
  const spacing = 15 * 60_000 + 1;
  for (let index = 0; index < LESSON_GENERATION_DAILY_USER_LIMIT; index += 1) {
    assert.equal(
      consumeLessonGenerationQuota(userId, `daily-ip-${userId}-${index}`, base + index * spacing).allowed,
      true,
    );
  }
  const blockedAt = base + LESSON_GENERATION_DAILY_USER_LIMIT * spacing;
  assert.equal(consumeLessonGenerationQuota(userId, `daily-ip-${userId}-blocked`, blockedAt).allowed, false);
  assert.equal(consumeLessonGenerationQuota(userId, `daily-ip-${userId}-tomorrow`, base + 24 * 60 * 60_000 + 1).allowed, true);
});
