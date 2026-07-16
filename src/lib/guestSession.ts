// Voice surfaces must never dead-end an unauthenticated user with a login
// demand — the app has instant guest sessions ("start free, no card").
// When a voice flow hits a 401 it calls this once and retries.
export async function ensureGuestSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/guest', { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}
