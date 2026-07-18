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

// Commissioned front-door artwork: a faceless electric-paper voice sculpture.
// The active colour pair stays permanent beneath a one-time graphite overlay,
// so the voice appears to draw itself into colour without loading video. The
// previous portrait remains in public/visuals/v3 as a backup only.
export const MILA_ATELIER: VisualScene = {
  id: 'mila-electric-paper-rotoscope-v1',
  stillDesktop: '/visuals/v4/mila-electric-voice-desktop-v1.webp',
  stillMobile: '/visuals/v4/mila-electric-voice-mobile-v1.webp',
  sketchDesktop: '/visuals/v5/mila-graphite-voice-desktop-v1.webp',
  sketchMobile: '/visuals/v5/mila-graphite-voice-mobile-v1.webp',
  focusDesktop: 'center center',
  focusMobile: 'center 31%',
  grade: 'brand',
};

export function visualScenesForRoute(path: string): VisualScene[] {
  return path === '/' ? [MILA_ATELIER] : [];
}
