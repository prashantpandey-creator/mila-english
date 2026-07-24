import type { Payment } from '@prisma/client';

export const PRO_30_PRODUCT = {
  code: 'mila_pro_30',
  name: 'FluentMitra Pro — 30 days',
  amountMinor: 149_000,
  currency: 'RUB',
  durationDays: 30,
} as const;

export type BillingProductCode = typeof PRO_30_PRODUCT.code;

export type PaidPassInput = {
  id: string;
  productCode: string;
  paidAt: Date | null;
  createdAt: Date;
};

export type PaidPassWindow = PaidPassInput & { accessStartsAt: Date; accessEndsAt: Date };

export function billingProduct(code: unknown) {
  return code === PRO_30_PRODUCT.code ? PRO_30_PRODUCT : null;
}

export function amountValue(amountMinor: number): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new Error('Invalid minor-unit amount');
  return `${Math.floor(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, '0')}`;
}

/**
 * Rebuild fixed-pass access in paid-time order. Recomputing from the ledger is
 * what makes an older refund pull later passes forward instead of leaving
 * access behind that no remaining payment bought.
 */
export function buildPaidPassWindows(payments: PaidPassInput[]): PaidPassWindow[] {
  let cursor: Date | null = null;
  return [...payments]
    .sort((left, right) => {
      const time = (left.paidAt || left.createdAt).getTime() - (right.paidAt || right.createdAt).getTime();
      return time || left.id.localeCompare(right.id);
    })
    .flatMap((payment) => {
      const product = billingProduct(payment.productCode);
      if (!product) return [];
      const paidAt = payment.paidAt || payment.createdAt;
      const accessStartsAt = cursor && cursor > paidAt ? cursor : paidAt;
      const accessEndsAt = new Date(accessStartsAt.getTime() + product.durationDays * 86_400_000);
      cursor = accessEndsAt;
      return [{ ...payment, accessStartsAt, accessEndsAt }];
    });
}

export type VerifiedProviderPayment = {
  id: string;
  status: string;
  paid: boolean;
  amount: { value: string; currency: string };
  metadata?: Record<string, unknown>;
  captured_at?: string;
  created_at?: string;
  refunded_amount?: { value: string; currency: string };
};

export function validateProviderPayment(local: Pick<Payment, 'id' | 'providerPaymentId' | 'amountMinor' | 'currency' | 'productCode'>, remote: VerifiedProviderPayment) {
  const remoteMinor = Math.round(Number(remote.amount?.value) * 100);
  const metadata = remote.metadata || {};
  return {
    idMatches: !!local.providerPaymentId && remote.id === local.providerPaymentId,
    amountMatches: Number.isSafeInteger(remoteMinor) && remoteMinor === local.amountMinor,
    currencyMatches: remote.amount?.currency === local.currency,
    purchaseMatches: metadata.purchase_id === local.id,
    productMatches: metadata.product_code === local.productCode,
    remoteMinor,
  };
}

export function isFullyRefunded(remote: VerifiedProviderPayment): boolean {
  if (!remote.refunded_amount || remote.refunded_amount.currency !== remote.amount.currency) return false;
  return Math.round(Number(remote.refunded_amount.value) * 100) >= Math.round(Number(remote.amount.value) * 100);
}

export class BillingError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
    this.name = 'BillingError';
  }
}
