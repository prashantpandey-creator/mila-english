import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decideVoiceLaunch,
  hasLiveVoiceAccess,
  type VoiceLaunchDecision,
} from './voiceSurfacePolicy';

test('the public voice surface exposes Live only', () => {
  assert.equal(hasLiveVoiceAccess({
    hasIdentity: true,
    isPro: true,
    freeLaunch: false,
  }), true);
  assert.equal(hasLiveVoiceAccess({
    hasIdentity: true,
    isPro: false,
    freeLaunch: true,
  }), true);
  assert.equal(hasLiveVoiceAccess({
    hasIdentity: false,
    isPro: false,
    freeLaunch: true,
  }), false);

  const decisions: VoiceLaunchDecision[] = [
    decideVoiceLaunch({
      preferenceLoaded: false,
      isConnecting: false,
      hasLiveAccess: true,
      hasLiveConsent: true,
    }),
    decideVoiceLaunch({
      preferenceLoaded: true,
      isConnecting: false,
      hasLiveAccess: false,
      hasLiveConsent: false,
    }),
    decideVoiceLaunch({
      preferenceLoaded: true,
      isConnecting: false,
      hasLiveAccess: true,
      hasLiveConsent: false,
    }),
    decideVoiceLaunch({
      preferenceLoaded: true,
      isConnecting: false,
      hasLiveAccess: true,
      hasLiveConsent: true,
    }),
  ];

  assert.deepEqual(decisions, [
    'blocked',
    'unavailable',
    'request-live-consent',
    'start-live',
  ]);
  assert.equal(decisions.some((decision) => decision.includes('private')), false);
  assert.equal(decisions.some((decision) => decision.includes('local')), false);
});
