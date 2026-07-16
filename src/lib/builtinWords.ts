export type BuiltinWord = {
  english: string;
  phonetic: string;
  translationNative: string;
  partOfSpeech: string;
  difficultyLevel: number;
};

export const BUILTIN_WORDS: BuiltinWord[] = [
  { english: 'hello', phonetic: '/həˈloʊ/', translationNative: 'привет', partOfSpeech: 'interjection', difficultyLevel: 1 },
  { english: 'goodbye', phonetic: '/ˌɡʊdˈbaɪ/', translationNative: 'до свидания', partOfSpeech: 'interjection', difficultyLevel: 1 },
  { english: 'please', phonetic: '/pliːz/', translationNative: 'пожалуйста', partOfSpeech: 'adverb', difficultyLevel: 1 },
  { english: 'thank you', phonetic: '/θæŋk juː/', translationNative: 'спасибо', partOfSpeech: 'phrase', difficultyLevel: 1 },
  { english: 'sorry', phonetic: '/ˈsɒri/', translationNative: 'извините', partOfSpeech: 'adjective', difficultyLevel: 1 },
  { english: 'maybe', phonetic: '/ˈmeɪbi/', translationNative: 'может быть', partOfSpeech: 'adverb', difficultyLevel: 1 },
  { english: 'beautiful', phonetic: '/ˈbjuːtɪfəl/', translationNative: 'красивый', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'delicious', phonetic: '/dɪˈlɪʃəs/', translationNative: 'вкусный', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'important', phonetic: '/ɪmˈpɔːtənt/', translationNative: 'важный', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'comfortable', phonetic: '/ˈkʌmftəbəl/', translationNative: 'удобный', partOfSpeech: 'adjective', difficultyLevel: 2 },
  { english: 'thought', phonetic: '/θɔːt/', translationNative: 'мысль', partOfSpeech: 'noun', difficultyLevel: 2 },
  { english: 'through', phonetic: '/θruː/', translationNative: 'через', partOfSpeech: 'preposition', difficultyLevel: 2 },
];
