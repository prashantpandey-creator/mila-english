import assert from 'node:assert';
import { resolvePlan, isPaid, planUnlocks, FEATURES, type StoredPlan } from './subscription';

const NOW = new Date('2026-07-18T12:00:00Z');
const future = new Date('2026-08-18T12:00:00Z');
const past = new Date('2026-06-18T12:00:00Z');

const at = (p: Partial<StoredPlan>) => resolvePlan(p, NOW);

// Free is the default and is never active/paid.
assert.strictEqual(at({}).plan, 'free');
assert.strictEqual(at({}).active, false);
assert.strictEqual(isPaid(at({})), false);
assert.strictEqual(at({ plan: 'free', planStatus: 'active' }).active, false);

// Active pro with a future renewal → paid.
{
  const s = at({ plan: 'pro', planStatus: 'active', planRenewsAt: future });
  assert.strictEqual(s.plan, 'pro');
  assert.strictEqual(s.active, true);
  assert.strictEqual(isPaid(s), true);
}

// Active pro with NO expiry (lifetime / manual grant) → paid.
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'active', planRenewsAt: null })), true);

// Canceled but still inside the paid period → access continues until renewsAt.
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'canceled', planRenewsAt: future })), true);

// Expired: the renewal date has passed → treated as free, no matter the label.
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'active', planRenewsAt: past })), false);
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'canceled', planRenewsAt: past })), false);
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'expired', planRenewsAt: future })), false);

// Payment failed (past_due) → no access (fail closed on money).
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'past_due', planRenewsAt: future })), false);

// String dates (as they arrive from JSON / SQLite) resolve the same way.
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'active', planRenewsAt: future.toISOString() })), true);
assert.strictEqual(isPaid(at({ plan: 'pro', planStatus: 'active', planRenewsAt: past.toISOString() })), false);

// Feature gating: the premium realtime voice is a paid feature; a paid user
// unlocks it, a free user does not.
assert.strictEqual(planUnlocks(at({ plan: 'pro', planStatus: 'active', planRenewsAt: future }), FEATURES.REALTIME_VOICE), true);
assert.strictEqual(planUnlocks(at({}), FEATURES.REALTIME_VOICE), false);
assert.strictEqual(planUnlocks(at({ plan: 'pro', planStatus: 'active', planRenewsAt: future }), FEATURES.CUSTOM_LESSONS), true);
assert.strictEqual(planUnlocks(at({}), FEATURES.CUSTOM_LESSONS), false);

console.log('subscription: all assertions pass');
