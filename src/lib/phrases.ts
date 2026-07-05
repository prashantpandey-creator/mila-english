// Travel-first phrase bank for the listen-and-repeat loop, grouped into packs.
// `hard` is the word Russian speakers most often stumble on; `sound` is the IPA
// target it drills (used by the session's weak-sound recap); `tip` is the cue.
export type Pack = 'airport' | 'cafe' | 'hotel' | 'directions' | 'emergencies';

export type Phrase = {
  text: string;
  ipa: string;
  ru: string;       // meaning, shown after the attempt
  hard: string;     // the word that carries the target sound
  sound: string;    // IPA phoneme this phrase drills
  tip: string;
  pack: Pack;
};

export const PACKS: { id: Pack; emoji: string; ru: string; en: string }[] = [
  { id: 'airport',     emoji: '✈️', ru: 'Аэропорт',    en: 'Airport' },
  { id: 'cafe',        emoji: '☕', ru: 'Кафе',         en: 'Café' },
  { id: 'hotel',       emoji: '🏨', ru: 'Отель',        en: 'Hotel' },
  { id: 'directions',  emoji: '🧭', ru: 'Направления',  en: 'Directions' },
  { id: 'emergencies', emoji: '🆘', ru: 'Экстренное',   en: 'Emergencies' },
];

// Recap knowledge: for each drilled sound, a canonical example + a one-line fix.
export const SOUND_INFO: Record<string, { ex: string; en: string; ru: string }> = {
  'θ':  { ex: 'think',     en: 'Tongue to the teeth — /θ/, not “s”.',      ru: 'Язык к зубам — /θ/, не «с».' },
  'ð':  { ex: 'this',      en: 'Voiced /ð/ — buzz it, not “z” or “d”.',    ru: 'Звонкий /ð/ — с голосом, не «з/д».' },
  'w':  { ex: 'where',     en: 'Round the lips — /w/, not /v/.',           ru: 'Округли губы — /w/, не /v/.' },
  'v':  { ex: 'available', en: 'Teeth on lip — /v/, not /w/.',             ru: 'Зубы на губе — /v/, не /w/.' },
  'r':  { ex: 'turn',      en: 'Soft English “r” — never rolled.',         ru: 'Мягкая «r» — без раската.' },
  'æ':  { ex: 'have',      en: 'Open vowel /æ/ — “a”, not “e”.',           ru: 'Открытый /æ/ — «а», не «э».' },
  'ə':  { ex: 'table',     en: 'Weak schwa /ə/ — swallow it.',             ru: 'Слабый /ə/ — проглоти.' },
  'h':  { ex: 'help',      en: 'Soft breath /h/ — don’t drop it.',         ru: 'Лёгкий выдох /h/ — не глотай.' },
  'tʃ': { ex: 'check',     en: '/tʃ/ — “ch”, not “sh”.',                   ru: '/tʃ/ — «ч», не «ш».' },
  'ɪə': { ex: 'nearest',   en: 'One glide /ɪə/ — “eer”.',                  ru: 'Один звук /ɪə/ — «иэ».' },
};

export const PHRASES: Phrase[] = [
  // ── Airport ──
  { pack: 'airport', text: "Where is the boarding gate?", ipa: '/wɛər ɪz ðə ˈbɔːdɪŋ ɡeɪt/', ru: 'Где выход на посадку?', hard: 'Where', sound: 'w', tip: '“Wh” is /w/ — round the lips, not a /v/.' },
  { pack: 'airport', text: "I have nothing to declare.", ipa: '/aɪ hæv ˈnʌθɪŋ tə dɪˈklɛər/', ru: 'Мне нечего декларировать.', hard: 'nothing', sound: 'θ', tip: 'The “th” in “nothing” is /θ/ — tongue to the teeth, not “nussing”.' },
  { pack: 'airport', text: "Excuse me, I think this is my seat.", ipa: '/ɪkˈskjuːz miː aɪ θɪŋk ðɪs ɪz maɪ siːt/', ru: 'Извините, кажется, это моё место.', hard: 'think', sound: 'θ', tip: 'The “th” is /θ/ — tongue between the teeth, not a hard “t” or “s”.' },
  { pack: 'airport', text: "Could you help me find my gate?", ipa: '/kʊd juː hɛlp miː faɪnd maɪ ɡeɪt/', ru: 'Не могли бы вы помочь найти выход?', hard: 'help', sound: 'h', tip: 'English “h” is a soft breath — “help”, don’t drop it.' },

  // ── Café ──
  { pack: 'cafe', text: "Could I have the bill, please?", ipa: '/kʊd aɪ hæv ðə bɪl pliːz/', ru: 'Можно счёт, пожалуйста?', hard: 'have', sound: 'æ', tip: 'The “a” in “have” is /æ/ — open, “hav”, not “hev”.' },
  { pack: 'cafe', text: "I would like a table for two.", ipa: '/aɪ wʊd laɪk ə ˈteɪbəl fɔːr tuː/', ru: 'Я бы хотел столик на двоих.', hard: 'table', sound: 'ə', tip: 'Ends on a soft “-bəl” — “tay-bul”, don’t harden the “l”.' },
  { pack: 'cafe', text: "Can I see the menu, please?", ipa: '/kæn aɪ siː ðə ˈmɛnjuː pliːz/', ru: 'Можно меню, пожалуйста?', hard: 'Can', sound: 'æ', tip: '“Can” uses /æ/ — open it, “kan”, not “ken”.' },
  { pack: 'cafe', text: "Is this seat taken?", ipa: '/ɪz ðɪs siːt ˈteɪkən/', ru: 'Это место занято?', hard: 'this', sound: 'ð', tip: 'The “th” in “this” is voiced /ð/ — buzz it, not “dis”.' },

  // ── Hotel ──
  { pack: 'hotel', text: "I'd like to check in, please.", ipa: '/aɪd laɪk tə tʃɛk ɪn pliːz/', ru: 'Я бы хотел заселиться.', hard: 'check', sound: 'tʃ', tip: '“Check” starts /tʃ/ — “ch”, not “sh”.' },
  { pack: 'hotel', text: "Do you have a room available?", ipa: '/duː juː hæv ə ruːm əˈveɪləbəl/', ru: 'У вас есть свободный номер?', hard: 'available', sound: 'v', tip: 'The “v” is /v/ — top teeth on lower lip, not a “w”.' },
  { pack: 'hotel', text: "What time is checkout?", ipa: '/wɒt taɪm ɪz ˈtʃɛkaʊt/', ru: 'Во сколько выселение?', hard: 'What', sound: 'w', tip: '“Wh” is /w/ — “wot”, round the lips.' },
  { pack: 'hotel', text: "Could you wake me at seven?", ipa: '/kʊd juː weɪk miː ət ˈsɛvən/', ru: 'Разбудите меня в семь?', hard: 'wake', sound: 'w', tip: '“w” again — “wake”, lips rounded, not “vake”.' },

  // ── Directions ──
  { pack: 'directions', text: "Where is the nearest station?", ipa: '/wɛər ɪz ðə ˈnɪərɪst ˈsteɪʃən/', ru: 'Где ближайшая станция?', hard: 'nearest', sound: 'ɪə', tip: 'The “ea” is one long /ɪə/ — “neer-est”, not “nee-a-rest”.' },
  { pack: 'directions', text: "How much does it cost to get there?", ipa: '/haʊ mʌtʃ dʌz ɪt kɒst tə ɡɛt ðɛər/', ru: 'Сколько стоит туда добраться?', hard: 'there', sound: 'ð', tip: 'The “th” is voiced /ð/ — buzz it, “ðere”, not “zere”.' },
  { pack: 'directions', text: "Is it far from here?", ipa: '/ɪz ɪt fɑːr frɒm hɪər/', ru: 'Это далеко отсюда?', hard: 'here', sound: 'h', tip: 'Breathe the “h” — “here”, don’t drop it to “ear”.' },
  { pack: 'directions', text: "Turn left at the corner.", ipa: '/tɜːn lɛft ət ðə ˈkɔːnər/', ru: 'Поверните налево на углу.', hard: 'Turn', sound: 'r', tip: 'The “r” colours the vowel — “turn”, not a rolled Russian “р”.' },

  // ── Emergencies ──
  { pack: 'emergencies', text: "I've lost my passport.", ipa: '/aɪv lɒst maɪ ˈpɑːspɔːt/', ru: 'Я потерял паспорт.', hard: 'passport', sound: 'æ', tip: '“pass” opens to /æ/ (or /ɑː/) — not “pess”.' },
  { pack: 'emergencies', text: "Please call an ambulance.", ipa: '/pliːz kɔːl ən ˈæmbjələns/', ru: 'Вызовите скорую, пожалуйста.', hard: 'ambulance', sound: 'æ', tip: '“a” is /æ/ — “am-”, open the vowel.' },
  { pack: 'emergencies', text: "I don't feel well.", ipa: '/aɪ dəʊnt fiːl wɛl/', ru: 'Мне нехорошо.', hard: 'well', sound: 'w', tip: '“w” — “well”, round the lips, not “vell”.' },
  { pack: 'emergencies', text: "Where is the nearest hospital?", ipa: '/wɛər ɪz ðə ˈnɪərɪst ˈhɒspɪtəl/', ru: 'Где ближайшая больница?', hard: 'hospital', sound: 'h', tip: 'Breathe the “h” — “hospital”, don’t drop it.' },
];
