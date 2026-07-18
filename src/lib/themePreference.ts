// Legacy preference helpers retained for stored-setting compatibility. Route
// surfaces no longer consume them: Mila's warm-light product room and neutral
// dark voice studio are selected deterministically by RouteSurface.
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'mila_theme';
export const THEME_EVENT = 'mila-theme-preference';

export function getThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'light';
  } catch {
    return 'light';
  }
}

export function setThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
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
