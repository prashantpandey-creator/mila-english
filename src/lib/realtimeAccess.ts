import { GIA_LIVE_FREE_LAUNCH } from '@/lib/giaAccess';

export type RealtimeMode = 'assessment' | 'companion' | 'gia' | 'pia' | 'tutor' | 'kids';

/**
 * Assessment, the legacy one-time companion preview, and Gia's free-first
 * launch are outside the product paywall. The daily-use English tutor remains
 * paid in production regardless of mutable environment drift.
 */
export function realtimeModeRequiresPaid(
  mode: RealtimeMode,
  environment: { NODE_ENV?: string; VOICE_REALTIME_PAID_ONLY?: string } = process.env,
): boolean {
  if (
    mode === 'assessment'
    || mode === 'companion'
    || mode === 'kids'
    || (mode === 'gia' && GIA_LIVE_FREE_LAUNCH)
  ) return false;
  if (environment.NODE_ENV === 'production') return true;
  return /^(?:1|true|yes)$/i.test(environment.VOICE_REALTIME_PAID_ONLY || '');
}
