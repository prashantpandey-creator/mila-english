// ── voiceCommands.ts — deterministic navigation grammar for spoken turns ────
// A spoken transcript is checked here BEFORE it reaches the language model:
// a matched command navigates instantly (no generation, no persistence).
// The grammar is deliberately strict — verb + target, or a bare "back" — so
// ordinary conversation ("I like grammar") is never hijacked.

export type VoiceCommand =
  | { kind: 'back' }
  | { kind: 'goto'; route: string; labelEn: string; labelRu: string };

type Destination = { route: string; labelEn: string; labelRu: string; aliases: string[] };

const DESTINATIONS: Destination[] = [
  { route: '/lessons', labelEn: 'Lessons', labelRu: 'Уроки', aliases: ['lessons', 'lesson', 'уроки', 'урок'] },
  { route: '/vocabulary', labelEn: 'Vocabulary', labelRu: 'Слова', aliases: ['vocabulary', 'words', 'слова', 'словарь'] },
  { route: '/grammar', labelEn: 'Grammar', labelRu: 'Грамматика', aliases: ['grammar', 'грамматика', 'грамматику'] },
  { route: '/phonetics', labelEn: 'Phonetics', labelRu: 'Фонетика', aliases: ['phonetics', 'pronunciation', 'фонетика', 'фонетику', 'произношение'] },
  { route: '/listen', labelEn: 'Listening', labelRu: 'Аудирование', aliases: ['listening', 'аудирование'] },
  { route: '/progress', labelEn: 'Progress', labelRu: 'Прогресс', aliases: ['progress', 'прогресс'] },
  { route: '/achievements', labelEn: 'Achievements', labelRu: 'Достижения', aliases: ['achievements', 'достижения'] },
  { route: '/dashboard', labelEn: 'Home', labelRu: 'Главная', aliases: ['dashboard', 'home', 'главная', 'главную', 'домой', 'кабинет'] },
  { route: '/chat', labelEn: 'Tutor chat', labelRu: 'Чат', aliases: ['chat', 'чат'] },
  { route: '/assessment', labelEn: 'Level check', labelRu: 'Проверка уровня', aliases: ['assessment', 'level check', 'тест уровня', 'проверку уровня'] },
  { route: '/darshan', labelEn: 'Voice room', labelRu: 'Голосовая комната', aliases: ['voice room', 'voice practice', 'голосовая комната', 'голосовую комнату'] },
];

// Leading verbs that turn a target into a command. Anchored at the start of
// the utterance (allowing a polite prefix) so mid-sentence mentions never fire.
const GOTO_EN = /^(?:please\s+)?(?:take me(?:\s+to)?|go to|open|show me|show)\s+(?:the\s+|my\s+)?(.+?)(?:\s+(?:menu|page|section|tab))?$/i;
const GOTO_RU = /^(?:пожалуйста\s+)?(?:открой|покажи|перейди(?:\s+(?:в|к|на))?|отведи меня(?:\s+(?:в|к|на))?|иди(?:\s+(?:в|к|на))?)\s+(?:мой\s+|мою\s+)?(.+?)(?:\s+(?:меню|страницу|раздел))?$/iu;

const BACK = /^(?:please\s+)?(?:go\s+back|take\s+me\s+back|back|назад|вернись(?:\s+назад)?|вернуться(?:\s+назад)?)$/iu;

// "take me home" / "отведи меня домой" without a article-stripped alias hit.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/gu, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function findDestination(rawTarget: string): Destination | null {
  const target = normalize(rawTarget);
  if (!target) return null;
  for (const destination of DESTINATIONS) {
    for (const alias of destination.aliases) {
      if (target === alias || target === `${alias} menu` || target === `меню ${alias}`) {
        return destination;
      }
    }
  }
  return null;
}

/** Parse a final spoken transcript into a navigation command, or null. */
export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const text = normalize(transcript);
  if (!text || text.split(' ').length > 8) return null;
  if (BACK.test(text)) return { kind: 'back' };
  const match = GOTO_EN.exec(text) || GOTO_RU.exec(text);
  if (!match) return null;
  const destination = findDestination(match[1]);
  if (!destination) return null;
  return { kind: 'goto', route: destination.route, labelEn: destination.labelEn, labelRu: destination.labelRu };
}
