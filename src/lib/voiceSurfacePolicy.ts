export type VoiceLaunchDecision =
  | 'blocked'
  | 'unavailable'
  | 'request-live-consent'
  | 'start-live';

export function hasLiveVoiceAccess({
  hasIdentity,
  isPro,
  freeLaunch,
}: {
  hasIdentity: boolean;
  isPro: boolean;
  freeLaunch: boolean;
}): boolean {
  return hasIdentity && (isPro || freeLaunch);
}

export function decideVoiceLaunch({
  preferenceLoaded,
  isConnecting,
  hasLiveAccess,
  hasLiveConsent,
}: {
  preferenceLoaded: boolean;
  isConnecting: boolean;
  hasLiveAccess: boolean;
  hasLiveConsent: boolean;
}): VoiceLaunchDecision {
  if (!preferenceLoaded || isConnecting) return 'blocked';
  if (!hasLiveAccess) return 'unavailable';
  if (!hasLiveConsent) return 'request-live-consent';
  return 'start-live';
}
