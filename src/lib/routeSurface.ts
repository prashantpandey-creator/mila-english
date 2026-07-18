export type MilaSurface = 'welcome';

/**
 * Mila has one visual room. Voice and practice routes communicate their state
 * through labels, motion, and geometry rather than switching the whole product
 * into a competing dark palette.
 */
export function routeSurfaceForPath(_pathname: string): MilaSurface {
  return 'welcome';
}
