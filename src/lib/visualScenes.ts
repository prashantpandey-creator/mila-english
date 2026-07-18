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

// Commissioned front-door artwork: an airy mixed-media portrait about finding
// your own voice. It deliberately avoids the generic language-app shorthand
// of headphones, chairs, laptops, flags, and tourist landmarks.
export const MILA_ATELIER: VisualScene = {
  id: 'mila-boho-editorial-v1',
  stillDesktop: '/visuals/v3/mila-boho-editorial-desktop-v1.webp',
  stillMobile: '/visuals/v3/mila-boho-editorial-desktop-v1.webp',
  focusDesktop: 'center center',
  focusMobile: '76% center',
  grade: 'brand',
};

export function visualScenesForRoute(path: string): VisualScene[] {
  return path === '/' ? [MILA_ATELIER] : [];
}
