import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isMiaChatHostname,
  MIACHAT_HOST,
  MIACHAT_ORIGIN,
  MILA_HOST,
  MILA_ORIGIN,
  normalizeHostname,
} from './productHosts';

test('Mila and MiaChat have explicit, stable production origins', () => {
  assert.equal(MILA_HOST, 'mila.purangpt.com');
  assert.equal(MIACHAT_HOST, 'miachat.purangpt.com');
  assert.equal(MILA_ORIGIN, 'https://mila.purangpt.com');
  assert.equal(MIACHAT_ORIGIN, 'https://miachat.purangpt.com');
});

test('host matching is exact and safely normalizes ports and case', () => {
  assert.equal(normalizeHostname('MiaChat.PuranGPT.com:443'), MIACHAT_HOST);
  assert.equal(isMiaChatHostname('miachat.purangpt.com'), true);
  assert.equal(isMiaChatHostname('miachat.purangpt.com.attacker.example'), false);
  assert.equal(isMiaChatHostname('mila.purangpt.com'), false);
});
