// ── subscription.ts — pure entitlement logic (no DB, no I/O, fully tested) ──
// Mila's money axis. A user's plan lives as a handful of fields on the User
// row (see prisma schema); this module turns those fields into an effective
// "is this person a paying, currently-active subscriber" answer and decides
// which features that unlocks. Payment-provider integration (checkout,
// webhooks) is a separate layer that only ever WRITES these fields — this
// module is what the rest of the app READS.

export type Plan = 'free' | 'pro';
export const PLANS: readonly Plan[] = ['free', 'pro'] as const;

/** The subscription fields as stored on the User row. */
export type StoredPlan = {
  plan?: string | null;
  planStatus?: string | null;
  planRenewsAt?: Date | string | null;
};

export type PlanState = {
  plan: Plan;
  status: string;
  /** Is a paid plan currently active (paid, not expired, not payment-failed)? */
  active: boolean;
  /** Current period end; null means no expiry (lifetime / manual grant / free). */
  renewsAt: Date | null;
};

/** Features that a paid plan unlocks. Extend as more get gated. */
export const FEATURES = {
  REALTIME_VOICE: 'realtime_voice',
} as const;
export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizePlan(value: string | null | undefined): Plan {
  return value === 'pro' ? 'pro' : 'free';
}

/**
 * Compute the effective plan state from stored fields.
 * Active ⇔ a paid plan AND not expired (renewsAt in the future or unset) AND
 * the status grants access. 'canceled' still has access until the period ends;
 * 'past_due'/'expired'/unknown do not (fail closed on money).
 */
export function resolvePlan(stored: StoredPlan, now: Date = new Date()): PlanState {
  const plan = normalizePlan(stored.plan);
  const status = (stored.planStatus || 'active').toLowerCase();
  const renewsAt = toDate(stored.planRenewsAt);

  if (plan === 'free') return { plan, status, active: false, renewsAt };

  const notExpired = renewsAt === null || renewsAt.getTime() > now.getTime();
  const statusGrants = status === 'active' || status === 'canceled';
  const active = notExpired && statusGrants;
  return { plan, status, active, renewsAt };
}

/** Is the user a currently-active paying subscriber? */
export function isPaid(state: PlanState): boolean {
  return state.plan !== 'free' && state.active;
}

/** Does the user's plan unlock a given gated feature? */
export function planUnlocks(state: PlanState, _feature: Feature): boolean {
  // Every gated feature currently requires an active paid plan. When tiers
  // diverge (e.g. a feature only 'pro' gets vs a future 'premium'), branch on
  // _feature here.
  return isPaid(state);
}
