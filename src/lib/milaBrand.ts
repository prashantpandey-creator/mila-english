/**
 * Public identity for the structured English-learning product.
 *
 * Keep the existing Mila technical IDs, routes, storage keys, payment codes,
 * and infrastructure stable. Public surfaces should use these values so a
 * future naming change does not require another repository-wide migration.
 */
export const MILA_PUBLIC_BRAND = Object.freeze({
  name: 'Mila',
  shortName: 'Mila',
  descriptor: 'Find your voice in any language.',
  title: 'Mila — Find your voice in any language',
  description:
    'A multilingual AI conversation companion for speaking with confidence, with structured English learning available when you want it.',
} as const);
