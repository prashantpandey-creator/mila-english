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

// Commissioned front-door artwork: cinematic and editorial, but still about
// listening, travel, and a safe place to practise. Desktop and mobile are
// separately composed so neither viewport destroys the focal point.
export const MILA_ATELIER: VisualScene = {
  id: 'mila-atelier-v1',
  stillDesktop: '/visuals/v2/cinematic/mila-atelier-desktop-v1.webp',
  stillMobile: '/visuals/v2/cinematic/mila-atelier-mobile-v1.webp',
  focusDesktop: 'center center',
  focusMobile: 'center center',
  grade: 'brand',
};

// The light front door: pink flowers, green foliage, and cream fabric carry
// Mila's Venus/Mercury identity without turning the page into an AI dashboard.
// The existing campaign studio remains the contained dark focus room.
export const MILA_GARDEN: VisualScene = {
  id: 'mila-garden',
  stillDesktop: '/ambience/stills/woman-flowers.jpg',
  video: '/ambience/woman-flowers.mp4',
  focusDesktop: '58% center',
  focusMobile: '62% center',
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

const ROUTE_SCENES: Record<'front' | 'nature' | 'study' | 'social' | 'club', VisualScene[]> = {
  front: [MILA_ATELIER],
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
  // The studio art stays inside active practice. The front door is the city:
  // café windows, night skylines, silk — the world the modern learner is
  // heading toward. The garden scene stays defined above for future rooms.
  social: [MILA_STUDIO],
  // Front door = the CITY in real color. The cafe/phone people clips are out
  // (owner directive 2026-07-17: wrong faces for the market, and beige-washed);
  // woman-coffee retired to its topic scene. woman-silk stays: highest-grade
  // clip in the library (1080p60) and on-palette.
  club: [
    legacyScene('city-night-bokeh', 'place'),
    legacyScene('us-manhattan', 'place'),
    legacyScene('woman-silk', 'brand'),
    legacyScene('uk-bigben-night', 'place'),
  ],
};

export function visualScenesForRoute(path: string): VisualScene[] {
  if (path === '/') return ROUTE_SCENES.front;
  if (path.startsWith('/dashboard')) return ROUTE_SCENES.club;
  if (path.startsWith('/progress') || path.startsWith('/achievements')) return ROUTE_SCENES.nature;
  if (path === '/lessons') return ROUTE_SCENES.club;
  if (path.startsWith('/lessons/') || path.startsWith('/vocabulary') || path.startsWith('/grammar') || path.startsWith('/phonetics')) return ROUTE_SCENES.study;
  if (path.startsWith('/listen') || path.startsWith('/chat') || path.startsWith('/darshan') || path.startsWith('/assessment')) return ROUTE_SCENES.social;
  return ROUTE_SCENES.club;
}
