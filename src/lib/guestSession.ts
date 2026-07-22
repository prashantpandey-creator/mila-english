// The app is login-gated: a session — a registered account OR an explicitly
// chosen guest — must already exist before a voice/chat flow runs. This helper
// only REPORTS whether an active session exists; it never silently creates a
// guest. Guests are created solely by the deliberate "Continue as guest"
// control on the auth pages (POST /api/auth/guest), so a shared browser can no
// longer be seated as a guest without a person choosing it, and a signed-in
// learner is never replaced by a background guest cookie.
let sessionCheckInFlight: Promise<boolean> | null = null;

export async function hasActiveSession(): Promise<boolean> {
  if (sessionCheckInFlight) return sessionCheckInFlight;
  sessionCheckInFlight = (async () => {
    try {
      const response = await fetch('/api/users/me', { cache: 'no-store' });
      return response.ok;
    } catch {
      return false;
    }
  })();
  try {
    return await sessionCheckInFlight;
  } finally {
    sessionCheckInFlight = null;
  }
}
