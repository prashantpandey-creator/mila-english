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

export type VisualStoryFrame = {
  id: 'quiet' | 'apart' | 'listen' | 'weave' | 'fold' | 'converge' | 'final';
  desktop: string;
  mobile: string;
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
// becomes Mila. These are deliberately separate desktop and mobile compositions
// rather than a responsive crop.
// The final graphite frame is the exact registered pair for the permanent
// mineral artwork, so the last reveal never jumps.
export const MILA_VOICE_ORIGIN_STORY: readonly VisualStoryFrame[] = [
  {
    id: 'quiet',
    desktop: '/visuals/v6/mila-story-00-quiet-desktop-v1.webp',
    mobile: '/visuals/v6/mila-story-00-quiet-mobile-v1.webp',
  },
  {
    id: 'apart',
    desktop: '/visuals/v6/mila-story-01-apart-desktop-v1.webp',
    mobile: '/visuals/v6/mila-story-01-apart-mobile-v1.webp',
  },
  {
    id: 'listen',
    desktop: '/visuals/v6/mila-story-02-listen-desktop-v1.webp',
    mobile: '/visuals/v6/mila-story-02-listen-mobile-v1.webp',
  },
  {
    id: 'weave',
    desktop: '/visuals/v6/mila-story-03-weave-desktop-v1.webp',
    mobile: '/visuals/v6/mila-story-03-weave-mobile-v1.webp',
  },
  {
    id: 'fold',
    desktop: '/visuals/v6/mila-story-04-fold-desktop-v1.webp',
    mobile: '/visuals/v6/mila-story-04-fold-mobile-v1.webp',
  },
  {
    id: 'converge',
    desktop: '/visuals/v6/mila-story-05-converge-desktop-v1.webp',
    mobile: '/visuals/v6/mila-story-05-converge-mobile-v1.webp',
  },
  {
    id: 'final',
    desktop: '/visuals/v5/mila-graphite-voice-desktop-v1.webp',
    mobile: '/visuals/v5/mila-graphite-voice-mobile-v1.webp',
  },
] as const;

export function visualScenesForRoute(path: string): VisualScene[] {
  return path === '/' ? [MILA_ATELIER] : [];
}
