export const HERO_STORY_FPS = 12;
export type HeroStoryMode = 'desktop' | 'mobile';

export const HERO_STORY_KEYFRAME_NAMES = [
  'quiet',
  'apart',
  'listen',
  'bridge',
  'weave',
  'midcurl',
  'fold',
  'tighten',
  'converge',
  'land',
  'nearfinal',
  'final',
] as const;

// Every number is the hard-cut hold for one genuinely different graphite
// drawing. Portrait rejects p93 and p995 because both moved away from their
// target endpoints; their four exposures become a longer final registration.
// There are no dissolved or optically blended poses.
export const HERO_STORY_DRAWING_HOLDS = {
  desktop: [
    8, 3, 3, 5, 2, 2, 5, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2,
    4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 7,
  ],
  mobile: [
    8, 3, 3, 5, 2, 2, 5, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2,
    4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 11,
  ],
} as const;

export const HERO_STORY_DRAWING_COUNTS = {
  desktop: HERO_STORY_DRAWING_HOLDS.desktop.length,
  mobile: HERO_STORY_DRAWING_HOLDS.mobile.length,
} as const;
export const HERO_STORY_DRAWING_COUNT = HERO_STORY_DRAWING_COUNTS.desktop;

export const HERO_STORY_EXPOSURE_COUNTS = {
  desktop: HERO_STORY_DRAWING_HOLDS.desktop.reduce((total, hold) => total + hold, 0),
  mobile: HERO_STORY_DRAWING_HOLDS.mobile.reduce((total, hold) => total + hold, 0),
} as const;
export const HERO_STORY_EXPOSURE_COUNT = HERO_STORY_EXPOSURE_COUNTS.desktop;

export const HERO_STORY_FILM_MS =
  (HERO_STORY_EXPOSURE_COUNT / HERO_STORY_FPS) * 1000;

export const HERO_STORY_REVEAL_MS = 600;
export const HERO_STORY_TOTAL_MS = HERO_STORY_FILM_MS + HERO_STORY_REVEAL_MS;

export function heroStoryDrawingAtExposure(
  exposure: number,
  mode: HeroStoryMode = 'desktop',
): number {
  const holds = HERO_STORY_DRAWING_HOLDS[mode];
  const exposureCount = HERO_STORY_EXPOSURE_COUNTS[mode];
  const safeExposure = Number.isFinite(exposure)
    ? Math.min(
      exposureCount - 1,
      Math.max(0, Math.floor(exposure)),
    )
    : exposure === Number.POSITIVE_INFINITY
      ? exposureCount - 1
      : 0;

  let end = 0;
  for (let index = 0; index < holds.length; index += 1) {
    end += holds[index];
    if (safeExposure < end) return index;
  }

  return holds.length - 1;
}
