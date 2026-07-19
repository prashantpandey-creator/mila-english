import assert from 'node:assert/strict';
import test from 'node:test';
import { realtimeModeRequiresPaid } from './realtimeAccess';

test('production Realtime voice stays paid even when a stale env says false', () => {
  assert.equal(realtimeModeRequiresPaid('tutor', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: 'false',
  }), true);
  assert.equal(realtimeModeRequiresPaid('companion', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: '',
  }), true);
});

test('assessment remains outside the product paywall', () => {
  assert.equal(realtimeModeRequiresPaid('assessment', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: 'true',
  }), false);
});

test('non-production environments can explicitly exercise either gate state', () => {
  assert.equal(realtimeModeRequiresPaid('tutor', {
    NODE_ENV: 'development',
    VOICE_REALTIME_PAID_ONLY: 'true',
  }), true);
  assert.equal(realtimeModeRequiresPaid('tutor', {
    NODE_ENV: 'development',
    VOICE_REALTIME_PAID_ONLY: 'false',
  }), false);
});
