export const TARGET_LANGUAGES = [
  {
    id: 'auto',
    en: 'Any language',
    ru: 'Любой язык',
    prompt: 'Auto: follow the language the learner is using, and teach whichever language they ask for',
  },
  { id: 'english', en: 'English', ru: 'Английский', prompt: 'English' },
  { id: 'spanish', en: 'Spanish', ru: 'Испанский', prompt: 'Spanish' },
  { id: 'french', en: 'French', ru: 'Французский', prompt: 'French' },
  { id: 'german', en: 'German', ru: 'Немецкий', prompt: 'German' },
  { id: 'hindi', en: 'Hindi', ru: 'Хинди', prompt: 'Hindi' },
  { id: 'portuguese', en: 'Portuguese', ru: 'Португальский', prompt: 'Portuguese' },
  { id: 'italian', en: 'Italian', ru: 'Итальянский', prompt: 'Italian' },
  { id: 'japanese', en: 'Japanese', ru: 'Японский', prompt: 'Japanese' },
  { id: 'korean', en: 'Korean', ru: 'Корейский', prompt: 'Korean' },
  { id: 'mandarin', en: 'Mandarin', ru: 'Китайский', prompt: 'Mandarin Chinese' },
  { id: 'arabic', en: 'Arabic', ru: 'Арабский', prompt: 'Arabic' },
  { id: 'russian', en: 'Russian', ru: 'Русский', prompt: 'Russian' },
] as const;

export type TargetLanguageId = (typeof TARGET_LANGUAGES)[number]['id'];

export function isTargetLanguageId(value: unknown): value is TargetLanguageId {
  return typeof value === 'string'
    && TARGET_LANGUAGES.some((language) => language.id === value);
}

export function targetLanguagePrompt(id: TargetLanguageId): string {
  return TARGET_LANGUAGES.find((language) => language.id === id)?.prompt
    ?? TARGET_LANGUAGES[0].prompt;
}
