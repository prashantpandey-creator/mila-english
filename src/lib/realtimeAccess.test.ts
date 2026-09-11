import assert from 'node:assert/strict';
import test from 'node:test';
import { realtimeModeRequiresPaid } from './realtimeAccess';

test('production Realtime voice keeps the tutor paid while Gia launches free', () => {
  assert.equal(realtimeModeRequiresPaid('tutor', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: 'false',
  }), true);
  assert.equal(realtimeModeRequiresPaid('gia', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: 'true',
  }), false);
});

test('assessment and free companion doors remain outside the product paywall', () => {
  assert.equal(realtimeModeRequiresPaid('assessment', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: 'true',
  }), false);
  // The "first conversation" is the acquisition hook — it stays free even
  // if a stale prod .env tries to force VOICE_REALTIME_PAID_ONLY on.
  assert.equal(realtimeModeRequiresPaid('companion', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: 'true',
  }), false);
  assert.equal(realtimeModeRequiresPaid('mia', {
    NODE_ENV: 'production',
    VOICE_REALTIME_PAID_ONLY: 'true',
  }), false);
  // Regression guard: a live production probe on 2026-09-12 found POST
  // /api/session?mode=pia returning 402 VOICE_PAID_FEATURE for a guest — this
  // function was the only gate that disagreed with route.ts treating pia as
  // guest-open (see PROJECT_LEDGER row 45).
  assert.equal(realtimeModeRequiresPaid('pia', {
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
