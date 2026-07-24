/**
 * Public identity for the structured English-learning product.
 *
 * Keep the existing Mila technical IDs, routes, storage keys, payment codes,
 * and infrastructure stable. Public surfaces should use these values so a
 * future naming change does not require another repository-wide migration.
 */
export const MILA_PUBLIC_BRAND = Object.freeze({
  name: 'FluentMitra',
  shortName: 'FluentMitra',
  descriptor: 'English explained in the language you know.',
  title: 'FluentMitra — Learn English in the language you know',
  description:
    'India-first English learning with an AI teacher matched to your native language, plus speaking, pronunciation, vocabulary, and progress.',
} as const);
