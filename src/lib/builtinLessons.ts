export type BuiltinPhrase = { en: string; ru: string };

export type BuiltinLesson = {
  id: string;
  icon: string;
  categoryRu: string;
  categoryEn: string;
  titleRu: string;
  titleEn: string;
  subtitleRu: string;
  subtitleEn: string;
  durationMinutes: number;
  difficulty: number;
  words: string[];
  phrases: BuiltinPhrase[];
};

export const BUILTIN_LESSONS: Record<string, BuiltinLesson> = {
  '1': {
    id: '1', icon: '🗣️', categoryRu: 'Разговор', categoryEn: 'Speaking',
    titleRu: 'Знакомство', titleEn: 'Introductions',
    subtitleRu: 'Представься и спроси имя', subtitleEn: 'Introduce yourself and ask names',
    durationMinutes: 3, difficulty: 1,
    words: ['Hello', 'My name is...', 'Nice to meet you', 'Where are you from?', 'I am from Russia'],
    phrases: [
      { en: 'Hello, how are you?', ru: 'Привет, как дела?' },
      { en: 'My name is Anna.', ru: 'Меня зовут Анна.' },
      { en: 'Nice to meet you!', ru: 'Приятно познакомиться!' },
      { en: 'I am from Moscow.', ru: 'Я из Москвы.' },
    ],
  },
  '2': {
    id: '2', icon: '☕', categoryRu: 'Разговор', categoryEn: 'Speaking',
    titleRu: 'В кафе', titleEn: 'At a Café', subtitleRu: 'Закажи кофе и еду', subtitleEn: 'Order coffee and food',
    durationMinutes: 5, difficulty: 1,
    words: ['I would like...', 'A coffee, please', 'How much is it?', 'The menu, please', 'Thank you'],
    phrases: [
      { en: 'I would like a coffee, please.', ru: 'Я бы хотел(а) кофе, пожалуйста.' },
      { en: 'How much is it?', ru: 'Сколько это стоит?' },
      { en: 'Can I see the menu?', ru: 'Можно меню?' },
      { en: 'Could I have the bill, please?', ru: 'Можно счёт, пожалуйста?' },
    ],
  },
  '3': {
    id: '3', icon: '✈️', categoryRu: 'Разговор', categoryEn: 'Speaking',
    titleRu: 'В аэропорту', titleEn: 'At the Airport',
    subtitleRu: 'Пройди регистрацию и паспортный контроль', subtitleEn: 'Check in and pass passport control',
    durationMinutes: 7, difficulty: 2,
    words: ['Where is the gate?', 'My flight is at...', 'Boarding pass', 'Passport control', 'Carry-on luggage'],
    phrases: [
      { en: 'Where is the boarding gate?', ru: 'Где выход на посадку?' },
      { en: 'Here is my passport.', ru: 'Вот мой паспорт.' },
      { en: 'I only have carry-on luggage.', ru: 'У меня только ручная кладь.' },
      { en: 'What time does boarding begin?', ru: 'Во сколько начинается посадка?' },
    ],
  },
  '4': {
    id: '4', icon: '🔤', categoryRu: 'Фонетика', categoryEn: 'Phonetics',
    titleRu: 'Сложные звуки', titleEn: 'Tricky Sounds',
    subtitleRu: 'th, w, r — звуки, которых нет в русском', subtitleEn: 'Practise th, w, and the English r',
    durationMinutes: 5, difficulty: 2,
    words: ['think', 'through', 'weather', 'world', 'river'],
    phrases: [
      { en: 'I think this is the right way.', ru: 'Думаю, это правильный путь.' },
      { en: 'The weather is warm today.', ru: 'Сегодня тёплая погода.' },
      { en: 'We walked through the old town.', ru: 'Мы прошли через старый город.' },
      { en: 'The river runs around the road.', ru: 'Река идёт вдоль дороги.' },
    ],
  },
  '5': {
    id: '5', icon: '📝', categoryRu: 'Слова', categoryEn: 'Vocabulary',
    titleRu: 'Базовые глаголы', titleEn: 'Essential Verbs',
    subtitleRu: 'Самые нужные глаголы на каждый день', subtitleEn: 'The most useful everyday verbs',
    durationMinutes: 4, difficulty: 1,
    words: ['be', 'have', 'do', 'go', 'make', 'get', 'know', 'think', 'see', 'come'],
    phrases: [
      { en: 'I have time today.', ru: 'Сегодня у меня есть время.' },
      { en: 'We can do it together.', ru: 'Мы можем сделать это вместе.' },
      { en: 'I want to go home.', ru: 'Я хочу пойти домой.' },
      { en: 'Please come and see.', ru: 'Пожалуйста, подойди и посмотри.' },
    ],
  },
  '6': {
    id: '6', icon: '📝', categoryRu: 'Слова', categoryEn: 'Vocabulary',
    titleRu: 'Эмоции и чувства', titleEn: 'Emotions',
    subtitleRu: 'Описывай свои чувства точно', subtitleEn: 'Express your feelings precisely',
    durationMinutes: 5, difficulty: 2,
    words: ['happy', 'excited', 'worried', 'confused', 'grateful', 'overwhelmed', 'proud'],
    phrases: [
      { en: 'I am excited about the trip.', ru: 'Я радуюсь поездке.' },
      { en: 'I feel a little worried.', ru: 'Я немного волнуюсь.' },
      { en: 'I am grateful for your help.', ru: 'Я благодарен(на) за вашу помощь.' },
      { en: 'I am proud of my progress.', ru: 'Я горжусь своим прогрессом.' },
    ],
  },
  '7': {
    id: '7', icon: '🎧', categoryRu: 'Аудирование', categoryEn: 'Listening',
    titleRu: 'Медленная речь', titleEn: 'Slow Speech',
    subtitleRu: 'Понимай медленную английскую речь', subtitleEn: 'Understand clear, slow English',
    durationMinutes: 5, difficulty: 1,
    words: ['Could you repeat that?', 'Please speak slowly', 'I understand', 'One more time', 'Thank you'],
    phrases: [
      { en: 'Could you speak a little more slowly?', ru: 'Не могли бы вы говорить немного медленнее?' },
      { en: 'Let me check that I understand.', ru: 'Позвольте уточнить, правильно ли я понял(а).' },
      { en: 'Could you say that one more time?', ru: 'Можете повторить ещё раз?' },
      { en: 'Yes, that makes sense now.', ru: 'Да, теперь всё понятно.' },
    ],
  },
  '8': {
    id: '8', icon: '🎧', categoryRu: 'Аудирование', categoryEn: 'Listening',
    titleRu: 'Естественная скорость', titleEn: 'Natural Speed',
    subtitleRu: 'Учись понимать носителей', subtitleEn: 'Follow natural connected speech',
    durationMinutes: 7, difficulty: 3,
    words: ['What are you up to?', 'Would you like to...?', 'I have got to go', 'See you later', 'Sounds good'],
    phrases: [
      { en: 'What are you up to this evening?', ru: 'Чем ты займёшься сегодня вечером?' },
      { en: 'Would you like to join us?', ru: 'Хочешь присоединиться к нам?' },
      { en: 'That sounds good to me.', ru: 'Мне нравится эта идея.' },
      { en: 'I have got to go, see you later.', ru: 'Мне пора, увидимся позже.' },
    ],
  },
  'grammar-basics': {
    id: 'grammar-basics', icon: '🧩', categoryRu: 'Грамматика', categoryEn: 'Grammar',
    titleRu: 'Грамматика в речи', titleEn: 'Grammar in Conversation',
    subtitleRu: 'Практика без сухих правил', subtitleEn: 'Practical patterns without dry rules',
    durationMinutes: 5, difficulty: 1,
    words: ['am / is / are', 'do / does', 'did', 'will', 'would'],
    phrases: [
      { en: 'She works from home.', ru: 'Она работает из дома.' },
      { en: 'Did you call yesterday?', ru: 'Ты звонил(а) вчера?' },
      { en: 'I will see you tomorrow.', ru: 'Увидимся завтра.' },
      { en: 'I would like some tea.', ru: 'Я бы хотел(а) чаю.' },
    ],
  },
};

export const COURSE_LESSON_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export function getBuiltinLesson(id: string | number): BuiltinLesson | null {
  return BUILTIN_LESSONS[String(id)] || null;
}

export function builtinLessonContent(lesson: BuiltinLesson): string {
  return lesson.phrases.map((phrase) => `${phrase.en} — ${phrase.ru}`).join('\n');
}
