#!/usr/bin/env node
// Grant / change a user's subscription by email — for comping testers, manual
// grants, and testing the paid gate before the payment provider exists.
// Run on the box:  docker exec mila node scripts/set-plan.mjs <email> <plan> [days]
//   <plan>  free | pro
//   [days]  optional: days until renewsAt (omit = no expiry / lifetime grant)
// Examples:
//   node scripts/set-plan.mjs test@x.dev pro          # lifetime pro (manual)
//   node scripts/set-plan.mjs test@x.dev pro 30        # pro for 30 days
//   node scripts/set-plan.mjs test@x.dev free          # revoke → free
import { PrismaClient } from '@prisma/client';

const [email, plan = 'pro', daysArg] = process.argv.slice(2);
if (!email || !['free', 'pro'].includes(plan)) {
  console.error('usage: set-plan.mjs <email> <free|pro> [days]');
  process.exit(1);
}

const prisma = new PrismaClient();
const days = daysArg ? Number(daysArg) : null;
const renewsAt = days && Number.isFinite(days) ? new Date(Date.now() + days * 864e5) : null;

const data = plan === 'free'
  ? { plan: 'free', planStatus: 'expired', planRenewsAt: null, planProvider: 'manual', planUpdatedAt: new Date() }
  : { plan: 'pro', planStatus: 'active', planRenewsAt: renewsAt, planProvider: 'manual', planUpdatedAt: new Date() };

try {
  const user = await prisma.user.update({ where: { email }, data, select: { id: true, email: true, plan: true, planStatus: true, planRenewsAt: true } });
  console.log('updated', JSON.stringify(user));
} catch (error) {
  console.error('failed:', error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
