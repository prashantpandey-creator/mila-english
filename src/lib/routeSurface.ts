export type MilaSurface = 'welcome' | 'focus';

const FOCUS_ROUTES = [
  '/assessment',
  '/listen',
  '/practice',
  '/darshan',
  '/pia',
];

/**
 * Mila has two intentionally different rooms:
 * - welcome: choosing, reflecting, celebrating, and arriving;
 * - focus: active practice with less visual stimulation.
 *
 * New informational routes default to welcome so they never accidentally
 * inherit the heavier training-room atmosphere.
 */
export function routeSurfaceForPath(pathname: string): MilaSurface {
  if (FOCUS_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return 'focus';
  return 'welcome';
}
