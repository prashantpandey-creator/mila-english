import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GIA_HOST,
  GIA_ORIGIN,
  effectiveProductPath,
  isGiaHostname,
  isMilaHostname,
  isMiaHostname,
  LEGACY_MIACHAT_HOST,
  MIA_HOST,
  MIA_ORIGIN,
  MILA_HOST,
  MILA_ORIGIN,
  normalizeHostname,
  productForHostname,
} from './productHosts';

test('Mila, Gia, and Mia have explicit, stable production origins', () => {
  assert.equal(MILA_HOST, 'mila.purangpt.com');
  assert.equal(GIA_HOST, 'gia.purangpt.com');
  assert.equal(MIA_HOST, 'mia.purangpt.com');
  assert.equal(LEGACY_MIACHAT_HOST, 'miachat.purangpt.com');
  assert.equal(MILA_ORIGIN, 'https://mila.purangpt.com');
  assert.equal(GIA_ORIGIN, 'https://gia.purangpt.com');
  assert.equal(MIA_ORIGIN, 'https://mia.purangpt.com');
});

test('host matching is exact and safely normalizes ports and case', () => {
  assert.equal(normalizeHostname('Gia.PuranGPT.com:443'), GIA_HOST);
  assert.equal(isGiaHostname('gia.purangpt.com'), true);
  assert.equal(isGiaHostname('gia.purangpt.com.attacker.example'), false);
  assert.equal(isGiaHostname(LEGACY_MIACHAT_HOST), false);
  assert.equal(isGiaHostname('mila.purangpt.com'), false);
  assert.equal(isMilaHostname('Mila.PuranGPT.com:443'), true);
  assert.equal(isMilaHostname(GIA_HOST), false);
  assert.equal(isMiaHostname('Mia.PuranGPT.com:443'), true);
  assert.equal(isMiaHostname('mia.purangpt.com.attacker.example'), false);
  assert.equal(isMiaHostname(GIA_HOST), false);
});

test('hostnames select one product without leaking between sibling products', () => {
  assert.equal(productForHostname(GIA_HOST), 'gia');
  assert.equal(productForHostname(MIA_HOST), 'mia');
  assert.equal(productForHostname(MILA_HOST), 'mila');
  assert.equal(productForHostname('localhost:3000'), 'mila');
});

test('product apex rewrites expose the internal route to client-side surfaces', () => {
  assert.equal(effectiveProductPath('gia', '/'), '/darshan');
  assert.equal(effectiveProductPath('mia', '/'), '/mia');
  assert.equal(effectiveProductPath('mila', '/'), '/');
  assert.equal(effectiveProductPath('gia', '/chat'), '/chat');
});
