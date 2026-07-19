// ── subscriptionStore.ts — the DB side of the money axis ────────────────────
// Reads/writes the subscription fields on the User row. The payment/webhook
// layer and the admin-grant script call applySubscriptionUpdate; the app reads
// getUserPlan. Entitlement logic lives in the pure, tested subscription.ts.
import { prisma } from '@/lib/prisma';
import { resolvePlan, type Plan, type PlanState } from '@/lib/subscription';

const PLAN_SELECT = {
  plan: true,
  planStatus: true,
  planRenewsAt: true,
} as const;

/** Effective plan state for a user id, or the free default if unknown. */
export async function getUserPlan(userId: number): Promise<PlanState> {
  if (!Number.isSafeInteger(userId) || userId <= 0) return resolvePlan({});
  const row = await prisma.user.findUnique({ where: { id: userId }, select: PLAN_SELECT });
  return resolvePlan(row ?? {});
}

export type SubscriptionUpdate = {
  plan: Plan;
  status?: string;
  renewsAt?: Date | null;
  provider?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
};

/**
 * Set a user's subscription. This is the single write path — a payment webhook
 * (on checkout / renewal / cancel) and the admin-grant script both call it, so
 * entitlement can never drift from one ad-hoc update site to another.
 */
export async function applySubscriptionUpdate(userId: number, update: SubscriptionUpdate) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      plan: update.plan,
      planStatus: update.status ?? 'active',
      planRenewsAt: update.renewsAt ?? null,
      planProvider: update.provider ?? null,
      planCustomerId: Object.prototype.hasOwnProperty.call(update, 'customerId') ? update.customerId : undefined,
      planSubscriptionId: Object.prototype.hasOwnProperty.call(update, 'subscriptionId') ? update.subscriptionId : undefined,
      planUpdatedAt: new Date(),
    },
  });
}
