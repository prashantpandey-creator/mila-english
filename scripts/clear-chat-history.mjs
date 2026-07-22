#!/usr/bin/env node
// Opt-in chat-history purge for Mila.
//
// Safe by default: does NOTHING unless a mode is explicitly chosen, either via
// the MILA_CLEAR_CHAT_HISTORY env var (read at container boot — see the
// Dockerfile CMD) or a CLI flag for a manual run, e.g.
//
//   docker exec mila node scripts/clear-chat-history.mjs --all
//   docker exec mila node scripts/clear-chat-history.mjs --guests
//
// Modes:
//   "guests" — delete only guest learners' conversation threads, messages, and
//              remembered facts. Idempotent and safe to leave enabled forever:
//              guests are no longer persisted, so after the first pass there is
//              nothing left to remove.
//   "all"    — delete EVERY conversation thread, message, and remembered fact
//              for every account. Destructive; intended for a single deploy to
//              wipe the historical leak, then unset the env var.
//
// Learner profiles, progress, assessments, words, and billing are never touched.

import { PrismaClient } from '@prisma/client';

function resolveMode() {
  const flag = process.argv.slice(2).find((arg) => arg === '--all' || arg === '--guests');
  if (flag === '--all') return 'all';
  if (flag === '--guests') return 'guests';
  const env = (process.env.MILA_CLEAR_CHAT_HISTORY || '').trim().toLowerCase();
  if (env === 'all') return 'all';
  if (env === 'guests' || env === 'guest' || env === '1' || env === 'true' || env === 'yes') return 'guests';
  return 'none';
}

// Mirrors isGuestIdentity() in src/lib/auth.ts.
const GUEST_EMAIL_PATTERNS = [/^guest@purangpt\.com$/i, /^guest-[0-9a-f-]+@mila\.local$/i];
function isGuestEmail(email) {
  return GUEST_EMAIL_PATTERNS.some((pattern) => pattern.test(String(email || '').trim().toLowerCase()));
}

async function main() {
  const mode = resolveMode();
  if (mode === 'none') {
    console.log('[clear-chat-history] MILA_CLEAR_CHAT_HISTORY unset — nothing to do.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    if (mode === 'all') {
      const messages = await prisma.companionMessage.deleteMany({});
      const threads = await prisma.companionThread.deleteMany({});
      const memories = await prisma.companionMemory.deleteMany({});
      console.warn(
        `[clear-chat-history] mode=ALL wiped ${messages.count} messages, ${threads.count} threads, ` +
        `${memories.count} remembered facts for ALL accounts. Unset MILA_CLEAR_CHAT_HISTORY so this ` +
        `does not repeat on the next boot.`,
      );
      return;
    }

    // mode === 'guests'
    const candidates = await prisma.user.findMany({
      where: {
        OR: [
          { accountType: 'guest' },
          { email: { contains: '@mila.local' } },
          { email: 'guest@purangpt.com' },
        ],
      },
      select: { id: true, email: true, accountType: true },
    });
    const guestIds = candidates
      .filter((user) => user.accountType === 'guest' || isGuestEmail(user.email))
      .map((user) => user.id);

    if (guestIds.length === 0) {
      console.log('[clear-chat-history] mode=guests — no guest accounts with stored history found.');
      return;
    }

    const messages = await prisma.companionMessage.deleteMany({ where: { Thread: { userId: { in: guestIds } } } });
    const threads = await prisma.companionThread.deleteMany({ where: { userId: { in: guestIds } } });
    const memories = await prisma.companionMemory.deleteMany({ where: { userId: { in: guestIds } } });
    console.log(
      `[clear-chat-history] mode=guests removed ${messages.count} messages, ${threads.count} threads, ` +
      `${memories.count} remembered facts across ${guestIds.length} guest accounts.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[clear-chat-history] failed:', error);
  // A purge failure must never block the server from starting.
  process.exitCode = 0;
});
