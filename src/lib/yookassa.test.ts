import assert from 'node:assert/strict';
import test from 'node:test';
import { createYooKassaPayment, fetchYooKassaPayment, paymentIdFromYooKassaEvent } from './yookassa';
import { loadKnownYooKassaPayment } from './billingStore';
import type { Payment } from '@prisma/client';

test('YooKassa checkout keeps price and product metadata server-side', async () => {
  const previousShop = process.env.YOOKASSA_SHOP_ID;
  const previousSecret = process.env.YOOKASSA_SECRET_KEY;
  const previousVat = process.env.YOOKASSA_VAT_CODE;
  const previousFetch = globalThis.fetch;
  process.env.YOOKASSA_SHOP_ID = 'test-shop';
  process.env.YOOKASSA_SECRET_KEY = 'test-secret';
  process.env.YOOKASSA_VAT_CODE = '1';
  let request: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    request = { url: String(url), init };
    return new Response(JSON.stringify({
      id: 'provider-payment-1',
      status: 'pending',
      paid: false,
      amount: { value: '1490.00', currency: 'RUB' },
      confirmation: { confirmation_url: 'https://checkout.example/one' },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    await createYooKassaPayment({
      purchaseId: 'purchase-1',
      idempotencyKey: 'idempotency-1',
      userId: 42,
      customerEmail: 'learner@example.com',
      returnUrl: 'https://mila.example/billing/return?purchase=purchase-1',
    });
    assert.ok(request);
    const captured = request as { url: string; init?: RequestInit };
    assert.equal(captured.url, 'https://api.yookassa.ru/v3/payments');
    assert.equal(new Headers(captured.init?.headers).get('Idempotence-Key'), 'idempotency-1');
    const body = JSON.parse(String(captured.init?.body));
    assert.deepEqual(body.amount, { value: '1490.00', currency: 'RUB' });
    assert.equal(body.metadata.purchase_id, 'purchase-1');
    assert.equal(body.metadata.product_code, 'mila_pro_30');
    assert.equal(body.metadata.user_id, '42');
    assert.equal(body.confirmation.return_url, 'https://mila.example/billing/return?purchase=purchase-1');
    assert.equal(body.receipt.customer.email, 'learner@example.com');
    assert.equal(body.receipt.items[0].vat_code, 1);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousShop === undefined) delete process.env.YOOKASSA_SHOP_ID; else process.env.YOOKASSA_SHOP_ID = previousShop;
    if (previousSecret === undefined) delete process.env.YOOKASSA_SECRET_KEY; else process.env.YOOKASSA_SECRET_KEY = previousSecret;
    if (previousVat === undefined) delete process.env.YOOKASSA_VAT_CODE; else process.env.YOOKASSA_VAT_CODE = previousVat;
  }
});

test('invalid provider payment IDs never reach the network', async () => {
  await assert.rejects(fetchYooKassaPayment('../secrets'), /Invalid YooKassa payment id/);
});

test('refund callbacks resolve the original payment id', () => {
  assert.equal(
    paymentIdFromYooKassaEvent('refund.succeeded', { id: 'refund-12345678', payment_id: 'payment-12345678' }),
    'payment-12345678',
  );
  assert.equal(
    paymentIdFromYooKassaEvent('payment.succeeded', { id: 'payment-12345678' }),
    'payment-12345678',
  );
  assert.equal(paymentIdFromYooKassaEvent('refund.succeeded', { id: 'refund-12345678' }), null);
});

test('unknown callback ids stop before any authenticated provider fetch', async () => {
  let providerFetches = 0;
  const loaded = await loadKnownYooKassaPayment(
    'unknown-payment-123',
    async () => null,
    async () => {
      providerFetches += 1;
      throw new Error('provider fetch must not run');
    },
  );
  assert.equal(loaded, null);
  assert.equal(providerFetches, 0);
});

test('known callback ids fetch provider truth after local preflight', async () => {
  const calls: string[] = [];
  const local = {
    id: 'purchase-1',
    provider: 'yookassa',
    providerPaymentId: 'payment-12345678',
  } as Payment;
  const loaded = await loadKnownYooKassaPayment(
    'payment-12345678',
    async () => { calls.push('local'); return local; },
    async () => {
      calls.push('provider');
      return {
        id: 'payment-12345678',
        status: 'succeeded',
        paid: true,
        amount: { value: '1490.00', currency: 'RUB' },
      };
    },
  );
  assert.deepEqual(calls, ['local', 'provider']);
  assert.equal(loaded?.local.id, 'purchase-1');
});
