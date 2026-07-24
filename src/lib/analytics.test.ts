import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasAnalyticsOptOut,
  isLikelyBot,
  normalizeTrackedPath,
  normalizeTrackedSite,
} from './analytics'

test('visitor paths keep only a bounded pathname', () => {
  assert.equal(normalizeTrackedPath('/pricing?campaign=private#buy'), '/pricing')
  assert.equal(normalizeTrackedPath('/learn/animals'), '/learn/animals')
  assert.equal(normalizeTrackedPath('https://example.com/steal'), null)
  assert.equal(normalizeTrackedPath('//example.com/steal'), null)
  assert.equal(normalizeTrackedPath('/api/session'), null)
  assert.equal(normalizeTrackedPath('/_next/static/file.js'), null)
  assert.equal(normalizeTrackedPath(`/${'a'.repeat(200)}`), null)
})

test('visitor sites are normalized without trusting arbitrary host text', () => {
  assert.equal(normalizeTrackedSite('MILA.PURANGPT.COM:443'), 'mila.purangpt.com')
  assert.equal(normalizeTrackedSite('gia.purangpt.com, proxy.internal'), 'gia.purangpt.com')
  assert.equal(normalizeTrackedSite('bad host value'), 'unknown')
})

test('privacy controls and common bots are excluded', () => {
  assert.equal(hasAnalyticsOptOut(new Headers({ dnt: '1' })), true)
  assert.equal(hasAnalyticsOptOut(new Headers({ 'sec-gpc': '1' })), true)
  assert.equal(hasAnalyticsOptOut(new Headers()), false)
  assert.equal(isLikelyBot('Googlebot/2.1'), true)
  assert.equal(isLikelyBot('Mozilla/5.0 Safari/605.1.15'), false)
})
