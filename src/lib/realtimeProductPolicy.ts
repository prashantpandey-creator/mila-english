import type { RealtimeMode } from './realtimeAccess';
import { isGiaHostname, isMiaHostname, isMilaHostname } from './productHosts';

export function isRealtimeModeAllowedForHostname(
  mode: RealtimeMode,
  hostname: string | null | undefined,
): boolean {
  if (isGiaHostname(hostname)) return mode === 'gia';
  if (isMiaHostname(hostname)) return mode === 'mia';
  if (isMilaHostname(hostname)) {
    return mode === 'assessment' || mode === 'tutor' || mode === 'kids'
      || mode === 'companion' || mode === 'pia';
  }
  return true;
}
