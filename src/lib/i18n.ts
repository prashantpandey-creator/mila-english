// ═══════════════════════════════════════════════════════
// i18n — Russian-first with English toggle
// ═══════════════════════════════════════════════════════

export type Lang = 'ru' | 'en';

const RU = {
  // ── Nav ──
  nav_dashboard: 'Главная',
  nav_lessons: 'Уроки',
  nav_vocabulary: 'Словарь',
  nav_progress: 'Прогресс',
  nav_achievements: 'Успехи',
  nav_phonetics: 'Произношение',
  nav_login: 'Войти',
  nav_register: 'Регистрация',
  nav_logout: 'Выйти',

  // ── Dashboard ──
  dashboard_title: 'Твой Путь к Английскому',
  dashboard_subtitle: 'Каждый день — маленький шаг к свободе говорить',
  dashboard_today_lesson: 'Сегодняшний урок',
  dashboard_words_review: 'Слова для повторения',
  dashboard_streak: 'Дней подряд',
  dashboard_start: 'Начать урок',
  dashboard_no_words: 'Пока нет слов для повторения. Начни урок!',

  // ── Lessons ──
  lessons_title: 'Твои Уроки',
  lessons_subtitle: 'Выбери тему и начни учиться в своём темпе',
  lessons_category_all: 'Все',
  lessons_category_phonetics: 'Фонетика',
  lessons_category_vocabulary: 'Слова',
  lessons_category_grammar: 'Грамматика',
  lessons_category_speaking: 'Разговор',
  lessons_category_listening: 'Аудирование',
  lessons_duration: 'мин',
  lessons_difficulty: 'Сложность',
  lessons_start: 'Начать',

  // ── Vocabulary ──
  vocab_title: 'Твой Словарь',
  vocab_subtitle: 'Повторяй слова, которые скоро забудутся',
  vocab_flip_hint: 'Нажми на карточку, чтобы перевернуть',
  vocab_remembered: 'Помню',
  vocab_forgot: 'Забыл(а)',
  vocab_due: 'слов ждут повторения',
  vocab_empty: 'Ты выучила все слова! Возвращайся позже.',

  // ── Progress ──
  progress_title: 'Твой Прогресс',
  progress_subtitle: 'Каждый урок приближает тебя к цели',
  progress_lessons_done: 'Уроков пройдено',
  progress_words_learned: 'Слов выучено',
  progress_hours: 'Часов занятий',
  progress_streak: 'Дней подряд',

  // ── Achievements ──
  achievements_title: 'Твои Достижения',
  achievements_subtitle: 'Отмечай свои победы',
  achievements_locked: 'Ещё не открыто',

  // ── Phonetics ──
  phonetics_title: 'Лаборатория Произношения',
  phonetics_subtitle: 'Слушай и повторяй. ИИ подскажет, если что-то не так.',
  phonetics_listen: 'Прослушать',
  phonetics_speak: 'Произнести',
  phonetics_recording: 'Запись...',
  phonetics_feedback_great: 'Отлично! Звучит естественно.',
  phonetics_feedback_good: 'Хорошо! Попробуй ещё раз для идеала.',
  phonetics_feedback_try: 'Попробуй ещё раз — у тебя получится!',
  phonetics_search: 'Найти слово...',

  // ── Assessment ──
  assessment_title: 'Определи Свой Уровень',
  assessment_subtitle: 'Мы подберём программу специально для тебя',
  assessment_start: 'Начать тест',
  assessment_result: 'Твой уровень',

  // ── Auth ──
  login_title: 'С Возвращением',
  login_subtitle: 'Продолжи свой путь к английскому',
  login_email: 'Email',
  login_password: 'Пароль',
  login_btn: 'Войти',
  login_no_account: 'Ещё нет аккаунта?',
  login_create: 'Создать',

  register_title: 'Начни Свой Путь',
  register_subtitle: 'Английский откроет новые двери',
  register_name: 'Имя',
  register_email: 'Email',
  register_password: 'Пароль',
  register_language: 'Родной язык',
  register_level: 'Я...',
  register_level_beginner: 'Начинающая — учу с нуля',
  register_level_young: 'Ребёнок (до 14 лет)',
  register_level_adult: 'Взрослая — понимаю, но боюсь говорить',
  register_level_intermediate: 'Средний уровень — хочу прорваться',
  register_btn: 'Начать Учиться',
  register_has_account: 'Уже есть аккаунт?',
  register_login: 'Войти',

  // ── Footer / Common ──
  footer_tagline: 'Сделано с любовью для тех, кто учит английский',
  loading: 'Загружаем...',
  error_try_again: 'Что-то пошло не так. Попробуй ещё раз.',
};

const EN: Record<keyof typeof RU, string> = {
  nav_dashboard: 'Home',
  nav_lessons: 'Lessons',
  nav_vocabulary: 'Vocabulary',
  nav_progress: 'Progress',
  nav_achievements: 'Achievements',
  nav_phonetics: 'Pronunciation',
  nav_login: 'Sign In',
  nav_register: 'Sign Up',
  nav_logout: 'Sign Out',

  dashboard_title: 'Your Path to English',
  dashboard_subtitle: 'Every day — one small step toward speaking freely',
  dashboard_today_lesson: "Today's Lesson",
  dashboard_words_review: 'Words to Review',
  dashboard_streak: 'Day Streak',
  dashboard_start: 'Start Lesson',
  dashboard_no_words: 'No words to review yet. Start a lesson!',

  lessons_title: 'Your Lessons',
  lessons_subtitle: 'Pick a topic and learn at your own pace',
  lessons_category_all: 'All',
  lessons_category_phonetics: 'Phonetics',
  lessons_category_vocabulary: 'Vocabulary',
  lessons_category_grammar: 'Grammar',
  lessons_category_speaking: 'Speaking',
  lessons_category_listening: 'Listening',
  lessons_duration: 'min',
  lessons_difficulty: 'Difficulty',
  lessons_start: 'Start',

  vocab_title: 'Your Vocabulary',
  vocab_subtitle: 'Review words before they fade',
  vocab_flip_hint: 'Tap card to flip',
  vocab_remembered: 'Remembered',
  vocab_forgot: 'Forgot',
  vocab_due: 'words due for review',
  vocab_empty: 'All caught up! Come back later.',

  progress_title: 'Your Progress',
  progress_subtitle: 'Every lesson brings you closer',
  progress_lessons_done: 'Lessons completed',
  progress_words_learned: 'Words learned',
  progress_hours: 'Hours studied',
  progress_streak: 'Day streak',

  achievements_title: 'Your Achievements',
  achievements_subtitle: 'Celebrate your wins',
  achievements_locked: 'Not yet unlocked',

  phonetics_title: 'Pronunciation Lab',
  phonetics_subtitle: 'Listen and repeat. AI will help you sound natural.',
  phonetics_listen: 'Listen',
  phonetics_speak: 'Speak',
  phonetics_recording: 'Listening...',
  phonetics_feedback_great: 'Perfect! Sounds natural.',
  phonetics_feedback_good: 'Good! One more try for perfect.',
  phonetics_feedback_try: 'Try again — you got this!',
  phonetics_search: 'Search a word...',

  assessment_title: 'Find Your Level',
  assessment_subtitle: "We'll create a program just for you",
  assessment_start: 'Start Test',
  assessment_result: 'Your Level',

  login_title: 'Welcome Back',
  login_subtitle: 'Continue your English journey',
  login_email: 'Email',
  login_password: 'Password',
  login_btn: 'Sign In',
  login_no_account: "Don't have an account?",
  login_create: 'Create one',

  register_title: 'Begin Your Journey',
  register_subtitle: 'English will open new doors',
  register_name: 'Name',
  register_email: 'Email',
  register_password: 'Password',
  register_language: 'Native language',
  register_level: 'I am...',
  register_level_beginner: 'Absolute Beginner — starting from zero',
  register_level_young: 'Young Learner (under 14)',
  register_level_adult: 'Adult Beginner — I understand but fear speaking',
  register_level_intermediate: 'Intermediate — ready to break through',
  register_btn: 'Start Learning',
  register_has_account: 'Already have an account?',
  register_login: 'Sign In',

  footer_tagline: 'Made with love for English learners',
  loading: 'Loading...',
  error_try_again: 'Something went wrong. Please try again.',
};

const translations = { ru: RU, en: EN };

export function t(key: keyof typeof RU, lang: Lang): string {
  return translations[lang]?.[key] || translations.ru[key] || key;
}

export function getLangFromStorage(): Lang {
  if (typeof window === 'undefined') return 'ru';
  return (localStorage.getItem('engfluent_lang') as Lang) || 'ru';
}

export function setLangStorage(lang: Lang) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('engfluent_lang', lang);
  }
}

export { RU, EN, translations };
