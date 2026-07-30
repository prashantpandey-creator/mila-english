export const PRESENCE_STORAGE_KEY = 'mila-presence-v1';

export const MILA_PRESENCES = [
  {
    id: 'signal',
    systemId: 'SYN-01',
    name: { en: 'Gia', ru: 'Джиа' },
    description: {
      en: 'Rose-gold portrait with a soft signal glow.',
      ru: 'Портрет в розовом золоте с мягким сигнальным сиянием.',
    },
    medium: { en: 'Cinematic', ru: 'Кинообраз' },
    animated: true,
    poster: '/avatar/presences/mila-v3/avatar.webp',
    expandedPortrait: '/avatar/presences/mila-v3/avatar.webp',
    expandedFraming: 'portrait',
    objectPosition: 'center',
  },
  {
    id: 'ember',
    systemId: 'SYN-02',
    name: { en: 'Ember', ru: 'Эмбер' },
    description: {
      en: 'Copper-toned portrait with warm cinematic light.',
      ru: 'Портрет в медных тонах с тёплым кинематографичным светом.',
    },
    medium: { en: 'Cinematic', ru: 'Кинообраз' },
    animated: true,
    poster: '/avatar/presences/ember-v3/avatar.webp',
    expandedPortrait: '/avatar/presences/ember-v3/avatar.webp',
    expandedFraming: 'portrait',
    objectPosition: 'center',
  },
  {
    id: 'nocturne',
    systemId: 'SYN-03',
    name: { en: 'Nocturne', ru: 'Ноктюрн' },
    description: {
      en: 'Luminous porcelain nocturne with pitch-black flowing hair.',
      ru: 'Сияющий фарфоровый ноктюрн с длинными иссиня-чёрными волосами.',
    },
    medium: { en: 'Cinematic', ru: 'Кинообраз' },
    animated: true,
    poster: '/avatar/presences/nocturne-v9/avatar.webp',
    expandedPortrait: '/avatar/presences/upper-body-v5/nocturne.webp',
    expandedFraming: 'upper-body',
    objectPosition: 'center',
  },
  {
    id: 'velvet',
    systemId: 'SYN-04',
    name: { en: 'Velvet', ru: 'Вельвет' },
    description: {
      en: 'Anime noir with a soft midnight glow.',
      ru: 'Аниме-нуар с мягким полуночным сиянием.',
    },
    medium: { en: 'Anime', ru: 'Аниме' },
    animated: true,
    poster: '/avatar/presences/velvet-v1/avatar.webp',
    expandedPortrait: '/avatar/presences/velvet-v1/avatar.webp',
    expandedFraming: 'portrait',
    objectPosition: 'center',
  },
] as const;

export type PresenceId = (typeof MILA_PRESENCES)[number]['id'];
export type PresenceProfile = (typeof MILA_PRESENCES)[number];

export function isPresenceId(value: unknown): value is PresenceId {
  return typeof value === 'string'
    && MILA_PRESENCES.some((presence) => presence.id === value);
}

export function presenceById(id: PresenceId): PresenceProfile {
  return MILA_PRESENCES.find((presence) => presence.id === id)
    ?? MILA_PRESENCES[0];
}

export function normalizePresenceId(value: unknown): PresenceId {
  return isPresenceId(value) ? value : 'signal';
}
