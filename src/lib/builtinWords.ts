export type BuiltinWord = {
  english: string;
  phonetic: string;
  translationNative: string;
  definitionEnglish: string;
  partOfSpeech: string;
  difficultyLevel: number;
};

export const BUILTIN_WORDS: BuiltinWord[] = [
  { english: 'hello', phonetic: '/həˈloʊ/', translationNative: 'привет', definitionEnglish: 'a greeting when you meet someone', partOfSpeech: 'interjection', difficultyLevel: 1 },
  { english: 'goodbye', phonetic: '/ˌɡʊdˈbaɪ/', translationNative: 'до свидания', definitionEnglish: 'what you say when you leave', partOfSpeech: 'interjection', difficultyLevel: 1 },
  { english: 'please', phonetic: '/pliːz/', translationNative: 'пожалуйста', definitionEnglish: 'a polite word used when asking', partOfSpeech: 'adverb', difficultyLevel: 1 },
  { english: 'thank you', phonetic: '/θæŋk juː/', translationNative: 'спасибо', definitionEnglish: 'words used to show gratitude', partOfSpeech: 'phrase', difficultyLevel: 1 },
  { english: 'sorry', phonetic: '/ˈsɒri/', translationNative: 'извините', definitionEnglish: 'used to apologise or show regret', partOfSpeech: 'adjective', difficultyLevel: 1 },
  { english: 'maybe', phonetic: '/ˈmeɪbi/', translationNative: 'может быть', definitionEnglish: 'possibly; it may happen', partOfSpeech: 'adverb', difficultyLevel: 1 },
  { english: 'beautiful', phonetic: '/ˈbjuːtɪfəl/', translationNative: 'красивый', definitionEnglish: 'very pleasing to see or experience', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'delicious', phonetic: '/dɪˈlɪʃəs/', translationNative: 'вкусный', definitionEnglish: 'having a very pleasant taste', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'important', phonetic: '/ɪmˈpɔːtənt/', translationNative: 'важный', definitionEnglish: 'having great value or effect', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'comfortable', phonetic: '/ˈkʌmftəbəl/', translationNative: 'удобный', definitionEnglish: 'feeling relaxed and at ease', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'thought', phonetic: '/θɔːt/', translationNative: 'мысль', definitionEnglish: 'an idea in your mind', partOfSpeech: 'noun', difficultyLevel: 2 },
  { english: 'through', phonetic: '/θruː/', translationNative: 'через', definitionEnglish: 'from one side or end to the other', partOfSpeech: 'preposition', difficultyLevel: 2 },
];
