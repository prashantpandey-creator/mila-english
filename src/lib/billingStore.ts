import { randomUUID } from 'node:crypto';
import type { Payment, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isGuestIdentity } from '@/lib/auth';
import { getUserPlan } from '@/lib/subscriptionStore';
import { isPaid } from '@/lib/subscription';
import {
  billingProduct,
  BillingError,
  buildPaidPassWindows,
  isFullyRefunded,
  PRO_30_PRODUCT,
  validateProviderPayment,
  type VerifiedProviderPayment,
} from '@/lib/billing';
import {
  createYooKassaPayment,
  fetchYooKassaPayment,
  isYooKassaConfigured,
} from '@/lib/yookassa';

type YooKassaPaymentLookup = (providerPaymentId: string) => Promise<Payment | null>;
type YooKassaPaymentFetcher = (providerPaymentId: string) => Promise<VerifiedProviderPayment>;

async function findKnownYooKassaPayment(providerPaymentId: string): Promise<Payment | null> {
  return prisma.payment.findFirst({
    where: { provider: 'yookassa', providerPaymentId },
  });
}

/**
 * Resolve Mila's local order before making an authenticated provider request.
 * Besides being the correct trust order, this prevents a forged public callback
 * from turning arbitrary IDs into YooKassa API traffic.
 */
export async function loadKnownYooKassaPayment(
  providerPaymentId: string,
  lookup: YooKassaPaymentLookup = findKnownYooKassaPayment,
  fetcher: YooKassaPaymentFetcher = fetchYooKassaPayment,
) {
  const local = await lookup(providerPaymentId);
  if (!local) return null;
  const remote = await fetcher(providerPaymentId);
  return { local, remote };
}

function appBaseUrl(requestOrigin?: string) {
  const configured = process.env.APP_URL?.trim()?.replace(/\/$/, '');
  const value = configured || (process.env.NODE_ENV !== 'production' ? requestOrigin?.replace(/\/$/, '') : '');
  if (!value || !/^https?:\/\//.test(value)) throw new BillingError('APP_URL_NOT_CONFIGURED', 'Billing return URL is not configured.', 503);
  if (process.env.NODE_ENV === 'production' && !value.startsWith('https://')) {
    throw new BillingError('APP_URL_NOT_SECURE', 'Billing requires an HTTPS application URL.', 503);
  }
  return value;
}

export async function beginCheckout(input: {
  userId: number;
  productCode: unknown;
  requestOrigin?: string;
}) {
  const product = billingProduct(input.productCode);
  if (!product) throw new BillingError('UNKNOWN_PRODUCT', 'That Mila product does not exist.', 400);
  if (!isYooKassaConfigured()) throw new BillingError('BILLING_NOT_CONFIGURED', 'Paid access is not open yet.', 503);

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new BillingError('UNAUTHORIZED', 'Sign in again to continue.', 401);
  if (isGuestIdentity(user.accountType, user.email)) {
    throw new BillingError('ACCOUNT_REQUIRED', 'Create an account first so paid access cannot be lost.', 409);
  }
  if (!user.emailVerifiedAt) {
    throw new BillingError('EMAIL_VERIFICATION_REQUIRED', 'Verify your email before buying Mila Pro.', 409);
  }

  const plan = await getUserPlan(user.id);
  if (isPaid(plan) && (!plan.renewsAt || plan.renewsAt.getTime() > Date.now() + 3 * 86_400_000)) {
    throw new BillingError('PLAN_ALREADY_ACTIVE', 'Mila Pro is already active on this account.', 409);
  }

  const recent = await prisma.payment.findFirst({
    where: {
      userId: user.id,
      provider: 'yookassa',
      productCode: product.code,
      status: { in: ['created', 'pending'] },
      createdAt: { gt: new Date(Date.now() - 60 * 60_000) },
    },
    orderBy: { createdAt: 'desc' },
  });
  const purchase = recent || await prisma.payment.create({
    data: {
      userId: user.id,
      provider: 'yookassa',
      productCode: product.code,
      amountMinor: product.amountMinor,
      currency: product.currency,
      idempotencyKey: randomUUID(),
    },
  });

  if (purchase.checkoutUrl && purchase.providerPaymentId) return purchase;

  const returnUrl = `${appBaseUrl(input.requestOrigin)}/billing/return?purchase=${encodeURIComponent(purchase.id)}`;
  const remote = await createYooKassaPayment({
    purchaseId: purchase.id,
    idempotencyKey: purchase.idempotencyKey,
    userId: user.id,
    customerEmail: user.email,
    returnUrl,
  });
  const checkoutUrl = remote.confirmation?.confirmation_url;
  if (!remote.id || !checkoutUrl) throw new BillingError('CHECKOUT_UNAVAILABLE', 'The payment page did not open. Try again.', 502);

  return prisma.payment.update({
    where: { id: purchase.id },
    data: { providerPaymentId: remote.id, checkoutUrl, status: remote.status === 'pending' ? 'pending' : 'created' },
  });
}

async function rebuildPaidAccess(tx: Prisma.TransactionClient, userId: number) {
  const payments = await tx.payment.findMany({
    where: { userId, status: 'paid' },
    orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  const windows = buildPaidPassWindows(payments);
  for (const window of windows) {
    const original = payments.find((payment) => payment.id === window.id);
    if (!original || original.accessStartsAt?.getTime() !== window.accessStartsAt.getTime() || original.accessEndsAt?.getTime() !== window.accessEndsAt.getTime()) {
      await tx.payment.update({
        where: { id: window.id },
        data: { accessStartsAt: window.accessStartsAt, accessEndsAt: window.accessEndsAt },
      });
    }
  }

  const active = [...windows].reverse().find((window) => window.accessEndsAt > new Date());
  const providerPayment = active ? payments.find((payment) => payment.id === active.id) : null;
  await tx.user.update({
    where: { id: userId },
    data: active ? {
      plan: 'pro',
      planStatus: 'active',
      planRenewsAt: active.accessEndsAt,
      planProvider: providerPayment?.provider || 'yookassa',
      planCustomerId: null,
      planSubscriptionId: providerPayment?.providerPaymentId || null,
      planUpdatedAt: new Date(),
    } : {
      plan: 'free',
      planStatus: 'expired',
      planRenewsAt: null,
      planProvider: 'yookassa',
      planCustomerId: null,
      planSubscriptionId: null,
      planUpdatedAt: new Date(),
    },
  });
}

/** Fetch provider truth, verify it against the local immutable order, then project entitlement. */
export async function reconcileYooKassaPayment(providerPaymentId: string, knownLocal?: Payment) {
  const loaded = await loadKnownYooKassaPayment(
    providerPaymentId,
    knownLocal ? async () => knownLocal : findKnownYooKassaPayment,
  );
  if (!loaded) throw new BillingError('UNKNOWN_PAYMENT', 'Payment does not match a Mila order.', 404);
  const { local, remote } = loaded;

  const checks = validateProviderPayment(local, remote);
  if (!checks.idMatches || !checks.amountMatches || !checks.currencyMatches || !checks.purchaseMatches || !checks.productMatches) {
    console.error('Rejected mismatched YooKassa payment', { providerPaymentId, checks });
    throw new BillingError('PAYMENT_MISMATCH', 'Payment details do not match the Mila order.', 409);
  }

  if (isFullyRefunded(remote)) {
    return prisma.$transaction(async (tx) => {
      const refunded = await tx.payment.update({
        where: { id: local.id },
        data: { status: 'refunded', refundedAt: new Date() },
      });
      if (refunded.userId) await rebuildPaidAccess(tx, refunded.userId);
      return refunded;
    });
  }

  if (remote.status === 'canceled') {
    return prisma.payment.update({ where: { id: local.id }, data: { status: 'canceled' } });
  }
  if (remote.status !== 'succeeded' || !remote.paid) return local;
  if (local.status === 'paid') return local;

  const product = billingProduct(local.productCode);
  if (!product) throw new BillingError('UNKNOWN_PRODUCT', 'Payment product no longer exists.', 409);
  const paidAt = remote.captured_at ? new Date(remote.captured_at) : new Date();

  return prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({ where: { id: local.id } });
    if (!fresh || fresh.status === 'paid') return fresh || local;
    const paid = await tx.payment.update({
      where: { id: local.id },
      data: { status: 'paid', paidAt },
    });
    if (fresh.userId) {
      await rebuildPaidAccess(tx, fresh.userId);
    }
    return tx.payment.findUnique({ where: { id: paid.id } }).then((updated) => updated || paid);
  });
}

export async function processYooKassaEvent(input: { eventType: string; providerPaymentId: string; eventKey: string }) {
  // YooKassa does not sign callback bodies. Unknown IDs are acknowledged but
  // never persisted and never sent to the provider API. Refund callbacks use
  // their `payment_id`, so legitimate refunds still resolve the original order.
  const knownLocal = await findKnownYooKassaPayment(input.providerPaymentId);
  if (!knownLocal) return null;

  const event = await prisma.paymentEvent.upsert({
    where: { providerEventKey: input.eventKey },
    create: {
      provider: 'yookassa',
      providerEventKey: input.eventKey,
      providerPaymentId: input.providerPaymentId,
      eventType: input.eventType,
    },
    update: {},
  });
  if (event.status === 'processed' || event.status === 'ignored') return event;

  try {
    await reconcileYooKassaPayment(input.providerPaymentId, knownLocal);
    return prisma.paymentEvent.update({
      where: { id: event.id },
      data: { status: 'processed', result: 'provider state reconciled', processedAt: new Date() },
    });
  } catch (error) {
    await prisma.paymentEvent.update({
      where: { id: event.id },
      data: { status: 'error', result: error instanceof Error ? error.message.slice(0, 300) : 'unknown error' },
    });
    throw error;
  }
}

export async function billingStatus(userId: number, purchaseId?: string | null) {
  // With no explicit return purchase, surface the learner's latest order so
  // Account can honestly show an in-progress or canceled checkout.
  let purchase = purchaseId
    ? await prisma.payment.findFirst({ where: { id: purchaseId, userId } })
    : await prisma.payment.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  if (purchase?.providerPaymentId && ['created', 'pending'].includes(purchase.status)) {
    try {
      purchase = await reconcileYooKassaPayment(purchase.providerPaymentId);
    } catch (error) {
      console.error('Could not refresh pending Mila payment', error);
    }
  }
  const plan = await getUserPlan(userId);
  return {
    plan,
    purchase: purchase ? {
      id: purchase.id,
      status: purchase.status,
      productCode: purchase.productCode,
      amountMinor: purchase.amountMinor,
      currency: purchase.currency,
      paidAt: purchase.paidAt,
      accessEndsAt: purchase.accessEndsAt,
    } : null,
  };
}

export function publicBillingCatalog() {
  return {
    provider: 'yookassa',
    configured: isYooKassaConfigured(),
    product: PRO_30_PRODUCT,
    renewsAutomatically: false,
  };
}
