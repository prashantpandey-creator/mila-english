export type RealtimeMode = 'assessment' | 'companion' | 'miachat' | 'pia' | 'tutor' | 'kids';

/**
 * Production speech-to-speech sessions are paid except for two free doors:
 * the assessment (always was) and `companion` — the free front-door "first
 * conversation" (owner decision 2026-07-20: the hook that proves voice
 * quality and earns trust stays free; daily-use `miachat`/`tutor` stay paid). The
 * environment flag remains useful for staging and local development, but a
 * stale production `.env` can never reopen paid voice for the gated modes.
 */
export function realtimeModeRequiresPaid(
  mode: RealtimeMode,
  environment: { NODE_ENV?: string; VOICE_REALTIME_PAID_ONLY?: string } = process.env,
): boolean {
  if (mode === 'assessment' || mode === 'companion' || mode === 'kids') return false;
  if (environment.NODE_ENV === 'production') return true;
  return /^(?:1|true|yes)$/i.test(environment.VOICE_REALTIME_PAID_ONLY || '');
}
