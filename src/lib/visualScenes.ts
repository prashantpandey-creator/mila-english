export type VisualSceneGrade = 'brand' | 'place' | 'study' | 'nature' | 'quiet';

export type VisualScene = {
  id: string;
  stillDesktop: string;
  stillMobile?: string;
  sketchDesktop?: string;
  sketchMobile?: string;
  video?: string;
  focusDesktop?: string;
  focusMobile?: string;
  grade?: VisualSceneGrade;
};

export type VisualStoryFilm = {
  desktop: string;
  mobile: string;
  posterDesktop: string;
  posterMobile: string;
};

// Commissioned front-door artwork: a faceless mineral-paper voice sculpture.
// The balanced graphite/eucalyptus colour pair stays permanent beneath the
// story's graphite overlay, while magenta remains the active waveform signal.
// previous portrait remains in public/visuals/v3 as a backup only.
export const MILA_ATELIER: VisualScene = {
  id: 'mila-mineral-paper-rotoscope-v1',
  stillDesktop: '/visuals/v6/mila-mineral-voice-desktop-v1.webp',
  stillMobile: '/visuals/v6/mila-mineral-voice-mobile-v1.webp',
  sketchDesktop: '/visuals/v5/mila-graphite-voice-desktop-v1.webp',
  sketchMobile: '/visuals/v5/mila-graphite-voice-mobile-v1.webp',
  focusDesktop: 'center center',
  focusMobile: 'center 31%',
  grade: 'brand',
};

// An original, silent entrance story: two equal paper figures arrive from
// different visual worlds, find a shared voice, and the line they make together
// becomes Mila. Landscape and portrait are separately art-directed films, not
// responsive crops. Landscape contains 53 real drawings and portrait 51
// curated drawings; both use 141 hard-cut graphite exposures at 12 fps. The
// final exposure is registered to the permanent mineral artwork beneath it.
export const MILA_VOICE_ORIGIN_FILM: VisualStoryFilm = {
  desktop: '/visuals/v7/mila-origin-film-desktop-v1.mp4',
  mobile: '/visuals/v7/mila-origin-film-mobile-v1.mp4',
  posterDesktop: '/visuals/v7/mila-origin-poster-desktop-v1.webp',
  posterMobile: '/visuals/v7/mila-origin-poster-mobile-v1.webp',
};

export function visualScenesForRoute(path: string): VisualScene[] {
  return path === '/' ? [MILA_ATELIER] : [];
}
