export type VisualSceneGrade = 'brand' | 'place' | 'study' | 'nature' | 'quiet';

export type VisualScene = {
  id: string;
  stillDesktop: string;
  stillMobile?: string;
  video?: string;
  focusDesktop?: string;
  focusMobile?: string;
  grade?: VisualSceneGrade;
};

// Commissioned front-door artwork: a faceless electric-paper voice sculpture.
// The previous portrait remains in public/visuals/v3 as a backup, while this
// active v4 pair gives desktop and mobile their own deliberate composition.
export const MILA_ATELIER: VisualScene = {
  id: 'mila-electric-paper-v2',
  stillDesktop: '/visuals/v4/mila-electric-voice-desktop-v1.webp',
  stillMobile: '/visuals/v4/mila-electric-voice-mobile-v1.webp',
  focusDesktop: 'center center',
  focusMobile: 'center 31%',
  grade: 'brand',
};

export function visualScenesForRoute(path: string): VisualScene[] {
  return path === '/' ? [MILA_ATELIER] : [];
}
