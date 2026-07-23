export const PRESENCE_STORAGE_KEY = 'mila-presence-v1';

export const MILA_PRESENCES = [
  {
    id: 'signal',
    systemId: 'SYN-01',
    name: { en: 'Mia', ru: 'Мия' },
    description: {
      en: 'Warm signal intelligence with a curious edge.',
      ru: 'Тёплый синтетический разум с живым любопытством.',
    },
    poster: '/avatar/presences/mila-v3/avatar.webp',
    objectPosition: 'center',
  },
  {
    id: 'ember',
    systemId: 'SYN-02',
    name: { en: 'Ember', ru: 'Эмбер' },
    description: {
      en: 'Copper warmth, worldly instinct, easy company.',
      ru: 'Медное тепло, интуиция и лёгкость в общении.',
    },
    poster: '/avatar/presences/ember-v3/avatar.webp',
    objectPosition: 'center',
  },
  {
    id: 'nocturne',
    systemId: 'SYN-03',
    name: { en: 'Nocturne', ru: 'Ноктюрн' },
    description: {
      en: 'Composed intelligence with a quiet voltage.',
      ru: 'Собранный разум со скрытым напряжением.',
    },
    poster: '/avatar/presences/nocturne-v3/avatar.webp',
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
