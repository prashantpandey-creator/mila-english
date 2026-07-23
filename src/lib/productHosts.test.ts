import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GIA_HOST,
  GIA_ORIGIN,
  isGiaHostname,
  LEGACY_MIACHAT_HOST,
  MILA_HOST,
  MILA_ORIGIN,
  normalizeHostname,
} from './productHosts';

test('Mila and Gia have explicit, stable production origins', () => {
  assert.equal(MILA_HOST, 'mila.purangpt.com');
  assert.equal(GIA_HOST, 'gia.purangpt.com');
  assert.equal(LEGACY_MIACHAT_HOST, 'miachat.purangpt.com');
  assert.equal(MILA_ORIGIN, 'https://mila.purangpt.com');
  assert.equal(GIA_ORIGIN, 'https://gia.purangpt.com');
});

test('host matching is exact and safely normalizes ports and case', () => {
  assert.equal(normalizeHostname('Gia.PuranGPT.com:443'), GIA_HOST);
  assert.equal(isGiaHostname('gia.purangpt.com'), true);
  assert.equal(isGiaHostname('gia.purangpt.com.attacker.example'), false);
  assert.equal(isGiaHostname(LEGACY_MIACHAT_HOST), false);
  assert.equal(isGiaHostname('mila.purangpt.com'), false);
});
