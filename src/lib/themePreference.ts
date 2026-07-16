// Mila's welcome room is blush by day, but nobody should be flashbanged at
// midnight: the room follows the device theme unless the learner overrides it.
// The focus studio is always dark and ignores this entirely — reading and
// practice surfaces never sit on a bright field.
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'mila_theme';
export const THEME_EVENT = 'mila-theme-preference';

export function getThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Private browsing: the choice still applies for this page via the event.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function resolveTheme(
  systemPrefersDark: boolean,
  preference: ThemePreference = getThemePreference(),
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}
