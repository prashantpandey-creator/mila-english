import assert from 'node:assert/strict';
import test from 'node:test';
import {
  amountValue,
  billingProduct,
  buildPaidPassWindows,
  isFullyRefunded,
  PRO_30_PRODUCT,
  validateProviderPayment,
  type VerifiedProviderPayment,
} from './billing';

const local = {
  id: 'purchase_1',
  providerPaymentId: 'provider_1',
  amountMinor: 149_000,
  currency: 'RUB',
  productCode: 'mila_pro_30',
};

const remote = (overrides: Partial<VerifiedProviderPayment> = {}): VerifiedProviderPayment => ({
  id: 'provider_1',
  status: 'succeeded',
  paid: true,
  amount: { value: '1490.00', currency: 'RUB' },
  metadata: { purchase_id: 'purchase_1', product_code: 'mila_pro_30' },
  ...overrides,
});

test('the public catalog exposes one immutable 30-day pass', () => {
  assert.equal(billingProduct(PRO_30_PRODUCT.code), PRO_30_PRODUCT);
  assert.equal(billingProduct('unlimited'), null);
  assert.equal(amountValue(PRO_30_PRODUCT.amountMinor), '1490.00');
});

test('provider reconciliation requires every immutable order field', () => {
  assert.deepEqual(validateProviderPayment(local, remote()), {
    idMatches: true,
    amountMatches: true,
    currencyMatches: true,
    purchaseMatches: true,
    productMatches: true,
    remoteMinor: 149_000,
  });
  assert.equal(validateProviderPayment(local, remote({ amount: { value: '14.90', currency: 'RUB' } })).amountMatches, false);
  assert.equal(validateProviderPayment(local, remote({ metadata: { purchase_id: 'someone-else', product_code: 'mila_pro_30' } })).purchaseMatches, false);
  assert.equal(validateProviderPayment(local, remote({ amount: { value: '1490.00', currency: 'USD' } })).currencyMatches, false);
});

test('only a full same-currency refund revokes access', () => {
  assert.equal(isFullyRefunded(remote({ refunded_amount: { value: '1490.00', currency: 'RUB' } })), true);
  assert.equal(isFullyRefunded(remote({ refunded_amount: { value: '100.00', currency: 'RUB' } })), false);
  assert.equal(isFullyRefunded(remote({ refunded_amount: { value: '1490.00', currency: 'USD' } })), false);
});

test('removing an earlier refunded pass pulls a later pass forward', () => {
  const firstPaid = new Date('2026-07-01T00:00:00Z');
  const secondPaid = new Date('2026-07-28T00:00:00Z');
  const stacked = buildPaidPassWindows([
    { id: 'first', productCode: PRO_30_PRODUCT.code, paidAt: firstPaid, createdAt: firstPaid },
    { id: 'second', productCode: PRO_30_PRODUCT.code, paidAt: secondPaid, createdAt: secondPaid },
  ]);
  assert.equal(stacked[1].accessStartsAt.toISOString(), '2026-07-31T00:00:00.000Z');
  assert.equal(stacked[1].accessEndsAt.toISOString(), '2026-08-30T00:00:00.000Z');

  const afterRefund = buildPaidPassWindows([
    { id: 'second', productCode: PRO_30_PRODUCT.code, paidAt: secondPaid, createdAt: secondPaid },
  ]);
  assert.equal(afterRefund[0].accessStartsAt.toISOString(), '2026-07-28T00:00:00.000Z');
  assert.equal(afterRefund[0].accessEndsAt.toISOString(), '2026-08-27T00:00:00.000Z');
});
