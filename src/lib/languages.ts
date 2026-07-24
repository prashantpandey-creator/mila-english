import { MILA_TARGET_LANGUAGE } from '@/lib/learningMarkets';

/**
 * Mila English intentionally has one target. Native languages are support
 * languages and live in learningMarkets.ts; they must never become a second
 * course target through a client-supplied chat value.
 */
export const TARGET_LANGUAGES = [
  {
    id: 'english',
    en: MILA_TARGET_LANGUAGE.name,
    ru: 'Английский',
    prompt: MILA_TARGET_LANGUAGE.name,
  },
] as const;

export type TargetLanguageId = (typeof TARGET_LANGUAGES)[number]['id'];

export function isTargetLanguageId(value: unknown): value is TargetLanguageId {
  return value === 'english';
}

export function targetLanguagePrompt(_id: TargetLanguageId): string {
  return MILA_TARGET_LANGUAGE.name;
}
