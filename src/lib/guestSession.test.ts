// Runnable proof that hasActiveSession only REPORTS session state and never
// silently creates a guest — guests are now an explicit opt-in on the auth
// pages. Run: npx tsx src/lib/guestSession.test.ts
import assert from 'node:assert/strict';
import { hasActiveSession } from './guestSession';

const originalFetch = globalThis.fetch;

async function run() {
  try {
    // An active session → true, checking only /api/users/me.
    const okCalls: string[] = [];
    globalThis.fetch = async (input) => {
      okCalls.push(String(input));
      return new Response('{}', { status: 200 });
    };
    assert.equal(await hasActiveSession(), true);
    assert.deepEqual(okCalls, ['/api/users/me']);

    // No session (401) → false, and CRUCIALLY no guest is created
    // (no POST to /api/auth/guest).
    const unauthCalls: string[] = [];
    globalThis.fetch = async (input) => {
      unauthCalls.push(String(input));
      return new Response('{}', { status: 401 });
    };
    assert.equal(await hasActiveSession(), false);
    assert.deepEqual(unauthCalls, ['/api/users/me']);

    // A server/network error also reports no session without creating a guest.
    const errorCalls: string[] = [];
    globalThis.fetch = async (input) => {
      errorCalls.push(String(input));
      return new Response('{}', { status: 500 });
    };
    assert.equal(await hasActiveSession(), false);
    assert.deepEqual(errorCalls, ['/api/users/me']);

    // Concurrent callers dedupe to a single check.
    let releaseCheck!: () => void;
    const gate = new Promise<void>((resolve) => { releaseCheck = resolve; });
    const concurrentCalls: string[] = [];
    globalThis.fetch = async (input) => {
      concurrentCalls.push(String(input));
      await gate;
      return new Response('{}', { status: 200 });
    };
    const first = hasActiveSession();
    const second = hasActiveSession();
    assert.deepEqual(concurrentCalls, ['/api/users/me']);
    releaseCheck();
    assert.deepEqual(await Promise.all([first, second]), [true, true]);
    assert.deepEqual(concurrentCalls, ['/api/users/me']);

    console.log('guestSession: all assertions pass');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void run();
