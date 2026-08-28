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

test('companion and pia stay reachable on mila.purangpt.com', () => {
  // Regression: 3176df8 (2026-08-03) added the hostname allowlist without
  // 'companion' or 'pia' — the exact modes /darshan and /pia have used since
  // the free-conversation fix (5fde9cf/8fe68b1, 2026-07-21). That silently
  // 403'd every voice session on the live site for 25 days; reproduced live
  // against mila.purangpt.com before this fix.
  assert.equal(isRealtimeModeAllowedForHostname('companion', 'mila.purangpt.com'), true);
  assert.equal(isRealtimeModeAllowedForHostname('pia', 'mila.purangpt.com'), true);
});

test('local and legacy hosts remain available for focused development', () => {
  assert.equal(isRealtimeModeAllowedForHostname('mia', 'localhost:3000'), true);
  assert.equal(isRealtimeModeAllowedForHostname('pia', 'pia.purangpt.com'), true);
});
