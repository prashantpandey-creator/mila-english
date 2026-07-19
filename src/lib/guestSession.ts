// Voice surfaces must never dead-end an unauthenticated user with a login
// demand — the app has instant guest sessions ("start free, no card").
// When a voice flow hits a 401 it calls this once and retries.
let guestSessionInFlight: Promise<boolean> | null = null;

export async function ensureGuestSession(): Promise<boolean> {
  if (guestSessionInFlight) return guestSessionInFlight;
  guestSessionInFlight = (async () => {
    try {
      // Never replace a signed-in learner with a new guest cookie. This also
      // makes callers safe to run while a page is still resolving auth state.
      const current = await fetch('/api/users/me', { cache: 'no-store' });
      if (current.ok) return true;
      if (current.status !== 401) return false;
      const response = await fetch('/api/auth/guest', { method: 'POST' });
      return response.ok;
    } catch {
      return false;
    }
  })();
  try {
    return await guestSessionInFlight;
  } finally {
    guestSessionInFlight = null;
  }
}
