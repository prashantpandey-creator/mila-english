export const MILA_TARGET_LANGUAGE = Object.freeze({
  id: 'en',
  name: 'English',
  nativeName: 'English',
  locale: 'en-IN',
} as const);

export const MILA_LEARNING_PROFILE_STORAGE_KEY = 'mila_learning_profile_v1';

export const INDIA_AI_ENGLISH_TEACHERS = [
  {
    id: 'asha',
    name: 'Asha',
    role: 'AI English teacher',
    country: 'India',
    nativeLanguageIds: ['hi', 'ur', 'pa'],
  },
  {
    id: 'meera',
    name: 'Meera',
    role: 'AI English teacher',
    country: 'India',
    nativeLanguageIds: ['bn', 'as', 'or'],
  },
  {
    id: 'tara',
    name: 'Tara',
    role: 'AI English teacher',
    country: 'India',
    nativeLanguageIds: ['ta', 'te', 'kn', 'ml'],
  },
  {
    id: 'kavya',
    name: 'Kavya',
    role: 'AI English teacher',
    country: 'India',
    nativeLanguageIds: ['mr', 'gu'],
  },
] as const;

export type IndiaAiEnglishTeacher =
  (typeof INDIA_AI_ENGLISH_TEACHERS)[number];
export type IndiaAiEnglishTeacherId = IndiaAiEnglishTeacher['id'];

export const INDIA_NATIVE_LANGUAGES = [
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    promise: 'अंग्रेज़ी अपनी भाषा में सीखें।',
    teacherId: 'asha',
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    locale: 'bn-IN',
    promise: 'নিজের ভাষায় ইংরেজি শিখুন।',
    teacherId: 'meera',
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    promise: 'మీ భాషలో ఇంగ్లీష్ నేర్చుకోండి.',
    teacherId: 'tara',
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    locale: 'mr-IN',
    promise: 'तुमच्या भाषेत इंग्रजी शिका.',
    teacherId: 'kavya',
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    locale: 'ta-IN',
    promise: 'உங்கள் மொழியில் ஆங்கிலம் கற்றுக்கொள்ளுங்கள்.',
    teacherId: 'tara',
  },
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    locale: 'gu-IN',
    promise: 'તમારી ભાષામાં અંગ્રેજી શીખો.',
    teacherId: 'kavya',
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    locale: 'kn-IN',
    promise: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಇಂಗ್ಲಿಷ್ ಕಲಿಯಿರಿ.',
    teacherId: 'tara',
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    locale: 'ml-IN',
    promise: 'നിങ്ങളുടെ ഭാഷയിൽ ഇംഗ്ലീഷ് പഠിക്കൂ.',
    teacherId: 'tara',
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    locale: 'pa-IN',
    promise: 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਅੰਗਰੇਜ਼ੀ ਸਿੱਖੋ।',
    teacherId: 'asha',
  },
  {
    id: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    locale: 'or-IN',
    promise: 'ନିଜ ଭାଷାରେ ଇଂରାଜୀ ଶିଖନ୍ତୁ।',
    teacherId: 'meera',
  },
  {
    id: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    locale: 'as-IN',
    promise: 'নিজৰ ভাষাত ইংৰাজী শিকক।',
    teacherId: 'meera',
  },
  {
    id: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    locale: 'ur-IN',
    promise: 'اپنی زبان میں انگریزی سیکھیں۔',
    teacherId: 'asha',
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  nativeName: string;
  locale: string;
  promise: string;
  teacherId: IndiaAiEnglishTeacherId;
}>;

export type IndiaNativeLanguage = (typeof INDIA_NATIVE_LANGUAGES)[number];
export type IndiaNativeLanguageId = IndiaNativeLanguage['id'];

const normalizeLookupValue = (value: string) =>
  value.trim().toLocaleLowerCase('en-IN');

/**
 * Resolves a supported language from its BCP47 language id, English name, or
 * native-script name. Unknown values deliberately return undefined so callers
 * never silently assume Hindi (or any other native language).
 */
export function resolveIndianNativeLanguage(
  value: unknown,
): IndiaNativeLanguage | undefined {
  if (typeof value !== 'string') return undefined;

  const normalized = normalizeLookupValue(value);
  if (!normalized) return undefined;

  return INDIA_NATIVE_LANGUAGES.find(
    (language) =>
      normalizeLookupValue(language.id) === normalized ||
      normalizeLookupValue(language.name) === normalized ||
      normalizeLookupValue(language.nativeName) === normalized,
  );
}

export function isSupportedIndianNativeLanguage(
  value: unknown,
): value is
  | IndiaNativeLanguageId
  | IndiaNativeLanguage['name']
  | IndiaNativeLanguage['nativeName'] {
  return resolveIndianNativeLanguage(value) !== undefined;
}

export function teacherForNativeLanguage(
  value: unknown,
): IndiaAiEnglishTeacher | undefined {
  const language = resolveIndianNativeLanguage(value);
  if (!language) return undefined;

  return INDIA_AI_ENGLISH_TEACHERS.find(
    (teacher) => teacher.id === language.teacherId,
  );
}

export const INDIA_LEARNING_MARKET = Object.freeze({
  id: 'in',
  countryCode: 'IN',
  countryName: 'India',
  targetLanguage: MILA_TARGET_LANGUAGE,
  nativeLanguages: INDIA_NATIVE_LANGUAGES,
  teachers: INDIA_AI_ENGLISH_TEACHERS,
} as const);
