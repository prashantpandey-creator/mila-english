export type MilaSurface = 'welcome' | 'focus';

const FOCUS_ROUTES = [
  '/darshan',
  '/pia',
  '/voice-lab',
];

/**
 * Mila has one product room, with a neutral focus surface reserved only for
 * full-screen voice experiences. Listening drills and assessment are standard
 * learning pages, so they deliberately stay on the warm welcome surface.
 *
 * New informational routes default to welcome so they never accidentally
 * inherit the immersive-room atmosphere.
 */
export function routeSurfaceForPath(pathname: string): MilaSurface {
  if (FOCUS_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return 'focus';
  return 'welcome';
}
