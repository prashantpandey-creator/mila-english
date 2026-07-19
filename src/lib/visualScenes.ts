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

// Commissioned front-door artwork: a faceless mineral-paper voice sculpture.
// The balanced graphite/eucalyptus colour pair stays permanent beneath a
// one-time graphite overlay, while magenta remains the active waveform signal.
// The previous portrait remains in public/visuals/v3 as a backup only.
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

export function visualScenesForRoute(path: string): VisualScene[] {
  return path === '/' ? [MILA_ATELIER] : [];
}
