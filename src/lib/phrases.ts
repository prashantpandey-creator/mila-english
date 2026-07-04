// Travel-first phrase bank for the listen-and-repeat loop. Ordered easy → harder.
// `hard` marks the word Russian speakers most often stumble on; `tip` is the cue.
export type Phrase = {
  text: string;
  ipa: string;
  ru: string;       // meaning, shown after the attempt
  hard: string;
  tip: string;
};

export const PHRASES: Phrase[] = [
  {
    text: 'Where is the nearest station?',
    ipa: '/wɛər ɪz ðə ˈnɪərɪst ˈsteɪʃən/',
    ru: 'Где ближайшая станция?',
    hard: 'nearest',
    tip: 'The “ea” is one long /ɪə/ — “neer-est”, not “nee-a-rest”.',
  },
  {
    text: 'Could I have the bill, please?',
    ipa: '/kʊd aɪ hæv ðə bɪl pliːz/',
    ru: 'Можно счёт, пожалуйста?',
    hard: 'Could',
    tip: 'The “l” is silent — say “cood”, not “koold”.',
  },
  {
    text: 'Would you mind repeating that?',
    ipa: '/wʊd juː maɪnd rɪˈpiːtɪŋ ðæt/',
    ru: 'Не могли бы вы повторить?',
    hard: 'repeating',
    tip: 'Stress the middle — re-PEAT-ing, not RE-peating.',
  },
  {
    text: 'I would like a table for two.',
    ipa: '/aɪ wʊd laɪk ə ˈteɪbəl fɔːr tuː/',
    ru: 'Я бы хотел столик на двоих.',
    hard: 'table',
    tip: 'Ends on a soft “-bəl” — “tay-bul”, don’t harden the “l”.',
  },
  {
    text: 'Excuse me, I think this is my seat.',
    ipa: '/ɪkˈskjuːz miː aɪ θɪŋk ðɪs ɪz maɪ siːt/',
    ru: 'Извините, кажется, это моё место.',
    hard: 'think',
    tip: 'The “th” is /θ/ — tongue between the teeth, not a hard “t” or “s”.',
  },
  {
    text: 'How much does it cost to get there?',
    ipa: '/haʊ mʌtʃ dʌz ɪt kɒst tə ɡɛt ðɛər/',
    ru: 'Сколько стоит туда добраться?',
    hard: 'there',
    tip: 'The “th” is voiced /ð/ — buzz it, “ðere”, not “zere”.',
  },
];
