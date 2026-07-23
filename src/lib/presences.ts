export const PRESENCE_STORAGE_KEY = 'mila-presence-v1';

export const MILA_PRESENCES = [
  {
    id: 'signal',
    name: { en: 'Mila', ru: 'Мила' },
    description: {
      en: 'Bright, curious and globally minded.',
      ru: 'Яркая, любознательная и открытая миру.',
    },
    poster: '/avatar/presences/mila-v2/avatar.webp',
    objectPosition: 'center',
  },
  {
    id: 'ember',
    name: { en: 'Ember', ru: 'Эмбер' },
    description: {
      en: 'Warm, worldly and easy to talk to.',
      ru: 'Тёплая, открытая миру и лёгкая в общении.',
    },
    poster: '/avatar/presences/ember-v2/avatar.webp',
    objectPosition: 'center',
  },
  {
    id: 'nocturne',
    name: { en: 'Nocturne', ru: 'Ноктюрн' },
    description: {
      en: 'Composed, direct and quietly bold.',
      ru: 'Собранная, прямая и спокойно смелая.',
    },
    poster: '/avatar/presences/nocturne-v2/avatar.webp',
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
