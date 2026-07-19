import { amountValue, PRO_30_PRODUCT, type VerifiedProviderPayment } from '@/lib/billing';

const YOOKASSA_API = 'https://api.yookassa.ru/v3';

function credentials() {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) throw new Error('YOOKASSA_NOT_CONFIGURED');
  return { shopId, secretKey };
}

function authorization() {
  const { shopId, secretKey } = credentials();
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;
}

export function isYooKassaConfigured() {
  return !!(process.env.YOOKASSA_SHOP_ID?.trim() && process.env.YOOKASSA_SECRET_KEY?.trim());
}

async function yooKassaRequest<T>(path: string, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<T> {
  const response = await fetcher(`${YOOKASSA_API}${path}`, {
    ...init,
    headers: {
      Authorization: authorization(),
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    signal: init.signal || AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const description = typeof body?.description === 'string' ? body.description : `YooKassa request failed (${response.status})`;
    throw new Error(description);
  }
  return body as T;
}

export type CreatedYooKassaPayment = VerifiedProviderPayment & {
  confirmation?: { type?: string; confirmation_url?: string };
};

export function paymentIdFromYooKassaEvent(eventType: string, object: unknown): string | null {
  if (!object || typeof object !== 'object') return null;
  const record = object as { id?: unknown; payment_id?: unknown };
  const candidate = eventType.startsWith('refund.')
    ? record.payment_id
    : eventType.startsWith('payment.') ? record.id : null;
  return typeof candidate === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(candidate)
    ? candidate
    : null;
}

export async function createYooKassaPayment(input: {
  purchaseId: string;
  idempotencyKey: string;
  userId: number;
  customerEmail: string;
  returnUrl: string;
}) {
  const receiptVatCode = process.env.YOOKASSA_VAT_CODE?.trim();
  const receipt = receiptVatCode ? {
    customer: { email: input.customerEmail },
    items: [{
      description: 'Mila Pro access — 30 days',
      quantity: '1.00',
      amount: { value: amountValue(PRO_30_PRODUCT.amountMinor), currency: PRO_30_PRODUCT.currency },
      vat_code: Number(receiptVatCode),
      payment_mode: 'full_payment',
      payment_subject: 'service',
    }],
  } : undefined;

  return yooKassaRequest<CreatedYooKassaPayment>('/payments', {
    method: 'POST',
    headers: { 'Idempotence-Key': input.idempotencyKey },
    body: JSON.stringify({
      amount: { value: amountValue(PRO_30_PRODUCT.amountMinor), currency: PRO_30_PRODUCT.currency },
      capture: true,
      confirmation: { type: 'redirect', return_url: input.returnUrl },
      description: `Mila Pro — 30 days (${input.purchaseId})`,
      metadata: {
        purchase_id: input.purchaseId,
        product_code: PRO_30_PRODUCT.code,
        user_id: String(input.userId),
      },
      ...(receipt ? { receipt } : {}),
    }),
  });
}

export async function fetchYooKassaPayment(paymentId: string) {
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(paymentId)) throw new Error('Invalid YooKassa payment id');
  return yooKassaRequest<VerifiedProviderPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}
