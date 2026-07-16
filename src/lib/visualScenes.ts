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

const legacyScene = (
  id: string,
  grade: VisualSceneGrade = 'quiet',
  focusDesktop = 'center center',
  focusMobile = focusDesktop,
): VisualScene => ({
  id,
  stillDesktop: `/ambience/stills/${id}.jpg`,
  video: `/ambience/${id}.mp4`,
  focusDesktop,
  focusMobile,
  grade,
});

// The first custom brand scene. New commissioned or generated artwork can be
// added as another descriptor without coupling its still to a video filename.
export const MILA_STUDIO: VisualScene = {
  id: 'mila-studio-v1',
  stillDesktop: '/visuals/v1/mila-studio-desktop-v1.webp',
  stillMobile: '/visuals/v1/mila-studio-mobile-v1.webp',
  focusDesktop: '78% 48%',
  focusMobile: '76% 34%',
  grade: 'brand',
};

export const COUNTRY_SCENES: Record<string, VisualScene[]> = {
  uk: [legacyScene('uk-bigben-night', 'place'), legacyScene('uk-tower', 'place')],
  us: [legacyScene('us-manhattan', 'place'), legacyScene('us-empire', 'place')],
  in: [
    legacyScene('in-taj-aerial', 'place'),
    legacyScene('in-saree-wedding', 'place'),
    legacyScene('in-saree-dance', 'place'),
    legacyScene('in-diwali', 'place'),
    legacyScene('in-palace', 'place'),
    legacyScene('in-holi', 'place'),
  ],
};

export const TOPIC_SCENES: Record<string, VisualScene[]> = {
  airport: [legacyScene('us-empire', 'place')],
  hotel: [legacyScene('venice-night', 'place')],
  cafe: [legacyScene('woman-coffee', 'quiet')],
  directions: [legacyScene('venice-night', 'place')],
  emergencies: [legacyScene('uk-bigben-night', 'place')],
};

const ROUTE_SCENES: Record<'nature' | 'study' | 'social' | 'club', VisualScene[]> = {
  nature: [
    legacyScene('nature-peaks', 'nature'),
    legacyScene('nature-aurora', 'nature'),
    legacyScene('nature-cliff', 'nature'),
    legacyScene('nature-volcano', 'nature'),
  ],
  study: [
    legacyScene('cathedral-light', 'study'),
    legacyScene('cathedral-columns', 'study'),
    legacyScene('woman-reading', 'study'),
  ],
  // The same art-directed campaign scene now unifies the front door and the
  // learner's main workspace. Future social scenes can simply be appended.
  social: [MILA_STUDIO],
  club: [MILA_STUDIO],
};

export function visualScenesForRoute(path: string): VisualScene[] {
  if (path.startsWith('/progress') || path.startsWith('/achievements')) return ROUTE_SCENES.nature;
  if (path.startsWith('/lessons') || path.startsWith('/vocabulary') || path.startsWith('/phonetics')) return ROUTE_SCENES.study;
  if (path.startsWith('/listen') || path.startsWith('/chat') || path.startsWith('/darshan') || path.startsWith('/dashboard') || path.startsWith('/assessment')) return ROUTE_SCENES.social;
  return ROUTE_SCENES.club;
}
