// Runnable proof that free voice preserves signed-in users and deduplicates
// concurrent guest seating. Run: npx tsx src/lib/guestSession.test.ts
import assert from 'node:assert/strict';
import { ensureGuestSession } from './guestSession';

const originalFetch = globalThis.fetch;

async function run() {
  try {
    const signedInCalls: string[] = [];
    globalThis.fetch = async (input) => {
      signedInCalls.push(String(input));
      return new Response('{}', { status: 200 });
    };
    assert.equal(await ensureGuestSession(), true);
    assert.deepEqual(signedInCalls, ['/api/users/me']);

    const guestCalls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      guestCalls.push(url);
      return new Response('{}', { status: url === '/api/users/me' ? 401 : 200 });
    };
    assert.equal(await ensureGuestSession(), true);
    assert.deepEqual(guestCalls, ['/api/users/me', '/api/auth/guest']);

    const failedCheckCalls: string[] = [];
    globalThis.fetch = async (input) => {
      failedCheckCalls.push(String(input));
      return new Response('{}', { status: 500 });
    };
    assert.equal(await ensureGuestSession(), false);
    assert.deepEqual(failedCheckCalls, ['/api/users/me']);

    let releaseCurrent!: () => void;
    const currentGate = new Promise<void>((resolve) => { releaseCurrent = resolve; });
    const concurrentCalls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      concurrentCalls.push(url);
      if (url === '/api/users/me') {
        await currentGate;
        return new Response('{}', { status: 401 });
      }
      return new Response('{}', { status: 200 });
    };
    const first = ensureGuestSession();
    const second = ensureGuestSession();
    assert.deepEqual(concurrentCalls, ['/api/users/me']);
    releaseCurrent();
    assert.deepEqual(await Promise.all([first, second]), [true, true]);
    assert.deepEqual(concurrentCalls, ['/api/users/me', '/api/auth/guest']);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void run().then(() => console.log('guest voice session: 8/8 pass'));
