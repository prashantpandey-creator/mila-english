import assert from 'node:assert/strict';
import test from 'node:test';
import { isRealtimeModeAllowedForHostname } from './realtimeProductPolicy';

test('each production hostname owns only its voice modes', () => {
  assert.equal(isRealtimeModeAllowedForHostname('gia', 'gia.purangpt.com'), true);
  assert.equal(isRealtimeModeAllowedForHostname('mia', 'gia.purangpt.com'), false);
  assert.equal(isRealtimeModeAllowedForHostname('tutor', 'gia.purangpt.com'), false);

  assert.equal(isRealtimeModeAllowedForHostname('mia', 'mia.purangpt.com'), true);
  assert.equal(isRealtimeModeAllowedForHostname('gia', 'mia.purangpt.com'), false);
  assert.equal(isRealtimeModeAllowedForHostname('tutor', 'mia.purangpt.com'), false);

  assert.equal(isRealtimeModeAllowedForHostname('tutor', 'mila.purangpt.com'), true);
  assert.equal(isRealtimeModeAllowedForHostname('assessment', 'mila.purangpt.com'), true);
  assert.equal(isRealtimeModeAllowedForHostname('gia', 'mila.purangpt.com'), false);
  assert.equal(isRealtimeModeAllowedForHostname('mia', 'mila.purangpt.com'), false);
});

test('local and legacy hosts remain available for focused development', () => {
  assert.equal(isRealtimeModeAllowedForHostname('mia', 'localhost:3000'), true);
  assert.equal(isRealtimeModeAllowedForHostname('pia', 'pia.purangpt.com'), true);
});
