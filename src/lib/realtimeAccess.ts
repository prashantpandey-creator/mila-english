export type RealtimeMode = 'assessment' | 'companion' | 'pia' | 'tutor';

/**
 * Production speech-to-speech sessions are always paid except for the explicit
 * assessment path. The environment flag remains useful for staging and local
 * development, but a stale production `.env` can never reopen paid voice.
 */
export function realtimeModeRequiresPaid(
  mode: RealtimeMode,
  environment: { NODE_ENV?: string; VOICE_REALTIME_PAID_ONLY?: string } = process.env,
): boolean {
  if (mode === 'assessment') return false;
  if (environment.NODE_ENV === 'production') return true;
  return /^(?:1|true|yes)$/i.test(environment.VOICE_REALTIME_PAID_ONLY || '');
}
