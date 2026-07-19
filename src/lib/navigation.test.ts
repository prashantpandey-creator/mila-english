import assert from 'node:assert/strict';
import test from 'node:test';
import { safeReturnTo } from './navigation';

test('safeReturnTo preserves only local Mila paths', () => {
  assert.equal(safeReturnTo('/assessment?step=2#question'), '/assessment?step=2#question');
  assert.equal(safeReturnTo('https://evil.example/steal'), '/dashboard');
  assert.equal(safeReturnTo('//evil.example/steal'), '/dashboard');
  assert.equal(safeReturnTo('javascript:alert(1)', '/'), '/');
  assert.equal(safeReturnTo(null, '/pricing'), '/pricing');
});
