import { z } from 'zod';

export const MIA_SCENE_DESTINATIONS = [
  'Lisbon',
  'Venice',
  'Jaipur',
  'Tokyo',
  'Seoul',
  'Mexico City',
  'Paris',
  'London',
  'Marrakech',
  'New York',
] as const;

export const miaSceneRequestSchema = z.object({
  destination: z.string().trim().min(2).max(80),
  situation: z.enum(['cafe', 'directions', 'arrival', 'market', 'evening']),
  level: z.enum(['first-words', 'conversational', 'confident']),
  uiLanguage: z.enum(['en', 'ru']).default('en'),
});

export const miaSceneResponseSchema = z.object({
  destination: z.string().trim().min(2).max(80),
  language: z.string().trim().min(2).max(40),
  title: z.string().trim().min(3).max(90),
  setting: z.string().trim().min(12).max(240),
  phrase: z.string().trim().min(1).max(160),
  pronunciation: z.string().trim().max(180),
  translation: z.string().trim().min(1).max(180),
  reply: z.string().trim().min(1).max(180),
  replyPronunciation: z.string().trim().max(200),
  replyTranslation: z.string().trim().min(1).max(200),
  cultureNote: z.string().trim().min(8).max(260),
  mission: z.string().trim().min(8).max(220),
  speechLocale: z.string().trim().min(2).max(20),
  visual: z.enum(['mediterranean', 'india', 'city-night', 'london', 'new-york', 'cafe', 'old-city']),
});

// Some OpenAI-compatible providers occasionally omit presentation-only fields
// even when structured output is requested. Keep the authored language content
// strict, but allow these two fields to be recovered from Mia's destination
// profile instead of throwing the entire generated scene away.
export const miaSceneModelSchema = miaSceneResponseSchema.extend({
  speechLocale: miaSceneResponseSchema.shape.speechLocale.optional(),
  visual: miaSceneResponseSchema.shape.visual.optional(),
});

export type MiaSceneRequest = z.infer<typeof miaSceneRequestSchema>;
export type MiaSceneResponse = z.infer<typeof miaSceneResponseSchema>;
export type MiaSceneModelResponse = z.infer<typeof miaSceneModelSchema>;
export type MiaSceneSituation = MiaSceneRequest['situation'];

type Phrase = Pick<
  MiaSceneResponse,
  'phrase' | 'pronunciation' | 'translation' | 'reply' | 'replyPronunciation' | 'replyTranslation'
>;

type PlaceProfile = {
  matches: string[];
  destination: string;
  language: string;
  speechLocale: string;
  visual: MiaSceneResponse['visual'];
  cultureNote: string;
  phrases: Record<MiaSceneSituation, Phrase>;
};

const englishPhrases: Record<MiaSceneSituation, Phrase> = {
  cafe: {
    phrase: 'Could I have a table by the window, please?',
    pronunciation: '',
    translation: 'A warm, natural way to ask for a specific table.',
    reply: 'Of course. This way, please.',
    replyPronunciation: '',
    replyTranslation: 'They have a table and are showing you where to sit.',
  },
  directions: {
    phrase: 'Excuse me, is this the right way to the station?',
    pronunciation: '',
    translation: 'A polite way to check that you are walking in the right direction.',
    reply: 'Yes—keep going, then take the second left.',
    replyPronunciation: '',
    replyTranslation: 'Continue straight and turn at the second street on the left.',
  },
  arrival: {
    phrase: 'Hi, I have a reservation under my name.',
    pronunciation: '',
    translation: 'Use this when arriving at a hotel, restaurant, or activity.',
    reply: 'Welcome. May I see your confirmation?',
    replyPronunciation: '',
    replyTranslation: 'They are ready to check the booking.',
  },
  market: {
    phrase: 'These are beautiful. Are they made locally?',
    pronunciation: '',
    translation: 'A friendly opener that shows interest before discussing price.',
    reply: 'Yes, they are made by an artist nearby.',
    replyPronunciation: '',
    replyTranslation: 'The item comes from a local maker.',
  },
  evening: {
    phrase: 'Is there somewhere nearby with live music?',
    pronunciation: '',
    translation: 'Ask for a local evening recommendation.',
    reply: 'Try the little place around the corner—it starts at nine.',
    replyPronunciation: '',
    replyTranslation: 'There is a nearby venue and the music begins at nine.',
  },
};

const profiles: PlaceProfile[] = [
  {
    matches: ['lisbon', 'portugal', 'porto'],
    destination: 'Lisbon',
    language: 'Portuguese',
    speechLocale: 'pt-PT',
    visual: 'mediterranean',
    cultureNote: 'In Portugal, a greeting before the request makes even a short exchange feel noticeably warmer.',
    phrases: {
      cafe: { phrase: 'Podia trazer-me um café, por favor?', pronunciation: 'po-DEE-ah trah-ZER-me oong kah-FEH, por fah-VOR', translation: 'Could you bring me a coffee, please?', reply: 'Claro. Quer com leite?', replyPronunciation: 'KLAH-roh. ker kong LAY-teh?', replyTranslation: 'Of course. Would you like it with milk?' },
      directions: { phrase: 'Desculpe, como chego à estação?', pronunciation: 'desh-KOOL-peh, KOH-moo SHEH-goo ah es-tah-SOWN', translation: 'Excuse me, how do I get to the station?', reply: 'Siga sempre em frente.', replyPronunciation: 'SEE-gah SEM-preh eng FREHN-teh', replyTranslation: 'Keep going straight ahead.' },
      arrival: { phrase: 'Olá, tenho uma reserva.', pronunciation: 'oh-LAH, TEN-yoo OO-mah reh-ZER-vah', translation: 'Hello, I have a reservation.', reply: 'Bem-vindo. Em que nome?', replyPronunciation: 'beng-VEEN-doo. eng keh NOH-meh?', replyTranslation: 'Welcome. Under what name?' },
      market: { phrase: 'Isto é feito aqui?', pronunciation: 'EESH-too eh FAY-too ah-KEE', translation: 'Is this made here?', reply: 'Sim, é de um artista local.', replyPronunciation: 'seeng, eh deh oong ar-TEESH-tah loo-KAHL', replyTranslation: 'Yes, it is by a local artist.' },
      evening: { phrase: 'Há música ao vivo por aqui?', pronunciation: 'ah MOO-zee-kah ow VEE-voo por ah-KEE', translation: 'Is there live music around here?', reply: 'Sim, começa às nove.', replyPronunciation: 'seeng, koh-MEH-sah az NOH-veh', replyTranslation: 'Yes, it starts at nine.' },
    },
  },
  {
    matches: ['venice', 'venezia', 'italy', 'rome', 'florence'],
    destination: 'Venice',
    language: 'Italian',
    speechLocale: 'it-IT',
    visual: 'mediterranean',
    cultureNote: 'A simple buongiorno or buonasera before a request is small, but it changes the tone of the whole exchange.',
    phrases: {
      cafe: { phrase: 'Vorrei un tavolo fuori, per favore.', pronunciation: 'vor-RAY oon TAH-voh-loh FWOH-ree, pehr fah-VOH-reh', translation: 'I would like a table outside, please.', reply: 'Certo, da questa parte.', replyPronunciation: 'CHER-toh, dah KWEH-stah PAR-teh', replyTranslation: 'Of course, this way.' },
      directions: { phrase: 'Scusi, come arrivo alla stazione?', pronunciation: 'SKOO-zee, KOH-meh ar-REE-voh AHL-lah stah-TSYOH-neh', translation: 'Excuse me, how do I get to the station?', reply: 'Sempre dritto, poi a sinistra.', replyPronunciation: 'SEM-preh DREET-toh, poy ah see-NEE-strah', replyTranslation: 'Straight ahead, then left.' },
      arrival: { phrase: 'Buonasera, ho una prenotazione.', pronunciation: 'bwoh-nah-SEH-rah, oh OO-nah preh-noh-tah-TSYOH-neh', translation: 'Good evening, I have a reservation.', reply: 'Benvenuto. A che nome?', replyPronunciation: 'ben-veh-NOO-toh. ah keh NOH-meh?', replyTranslation: 'Welcome. Under what name?' },
      market: { phrase: 'È fatto qui?', pronunciation: 'eh FAHT-toh kwee', translation: 'Is it made here?', reply: 'Sì, è artigianale.', replyPronunciation: 'see, eh ar-tee-jah-NAH-leh', replyTranslation: 'Yes, it is handmade.' },
      evening: { phrase: 'C’è musica dal vivo qui vicino?', pronunciation: 'cheh MOO-zee-kah dahl VEE-voh kwee vee-CHEE-noh', translation: 'Is there live music nearby?', reply: 'Sì, inizia alle nove.', replyPronunciation: 'see, ee-NEE-tsyah AHL-leh NOH-veh', replyTranslation: 'Yes, it starts at nine.' },
    },
  },
  {
    matches: ['jaipur', 'delhi', 'india', 'mumbai'],
    destination: 'Jaipur',
    language: 'Hindi',
    speechLocale: 'hi-IN',
    visual: 'india',
    cultureNote: 'A gentle namaste works well when entering a shop or meeting someone; warmth matters more than perfect grammar.',
    phrases: {
      cafe: { phrase: 'एक चाय मिलेगी, कृपया?', pronunciation: 'ek chai mi-lay-gee, krip-yaa?', translation: 'Could I have a tea, please?', reply: 'ज़रूर। चीनी लेंगे?', replyPronunciation: 'za-roor. chee-nee len-gay?', replyTranslation: 'Of course. Would you like sugar?' },
      directions: { phrase: 'माफ़ कीजिए, स्टेशन किधर है?', pronunciation: 'maaf kee-jee-yay, stay-shan ki-dhar hai?', translation: 'Excuse me, which way is the station?', reply: 'सीधे जाइए, फिर बाएँ।', replyPronunciation: 'see-dhay jai-yay, phir baa-yen', replyTranslation: 'Go straight, then left.' },
      arrival: { phrase: 'नमस्ते, मेरी बुकिंग है।', pronunciation: 'na-mas-tay, may-ree booking hai', translation: 'Hello, I have a booking.', reply: 'स्वागत है। किस नाम से?', replyPronunciation: 'svaa-gat hai. kis naam say?', replyTranslation: 'Welcome. Under what name?' },
      market: { phrase: 'क्या यह यहीं बना है?', pronunciation: 'kyaa yah ya-heen ba-naa hai?', translation: 'Was this made here?', reply: 'हाँ, यह स्थानीय है।', replyPronunciation: 'haan, yah sthaa-nee-y hai', replyTranslation: 'Yes, it is local.' },
      evening: { phrase: 'यहाँ लाइव संगीत कहाँ है?', pronunciation: 'ya-haan live san-geet ka-haan hai?', translation: 'Where is there live music here?', reply: 'पास में, नौ बजे से।', replyPronunciation: 'paas men, nau ba-jay say', replyTranslation: 'Nearby, from nine o’clock.' },
    },
  },
  {
    matches: ['tokyo', 'japan', 'kyoto', 'osaka'],
    destination: 'Tokyo',
    language: 'Japanese',
    speechLocale: 'ja-JP',
    visual: 'city-night',
    cultureNote: 'A small sumimasen gets attention politely and works before almost any request in a busy place.',
    phrases: {
      cafe: { phrase: '窓側の席をお願いします。', pronunciation: 'mado-gawa no seki o onegai shimasu', translation: 'A window seat, please.', reply: 'はい、こちらへどうぞ。', replyPronunciation: 'hai, kochira e douzo', replyTranslation: 'Yes, this way please.' },
      directions: { phrase: 'すみません、駅はどちらですか？', pronunciation: 'sumimasen, eki wa dochira desu ka?', translation: 'Excuse me, which way is the station?', reply: 'まっすぐ行って、左です。', replyPronunciation: 'massugu itte, hidari desu', replyTranslation: 'Go straight, then it is on the left.' },
      arrival: { phrase: '予約しています。', pronunciation: 'yoyaku shite imasu', translation: 'I have a reservation.', reply: 'お名前をお願いします。', replyPronunciation: 'onamae o onegai shimasu', replyTranslation: 'Your name, please.' },
      market: { phrase: 'これはここで作られましたか？', pronunciation: 'kore wa koko de tsukuraremashita ka?', translation: 'Was this made here?', reply: 'はい、地元で作りました。', replyPronunciation: 'hai, jimoto de tsukurimashita', replyTranslation: 'Yes, it was made locally.' },
      evening: { phrase: '近くにライブ音楽はありますか？', pronunciation: 'chikaku ni raibu ongaku wa arimasu ka?', translation: 'Is there live music nearby?', reply: 'はい、九時からです。', replyPronunciation: 'hai, kuji kara desu', replyTranslation: 'Yes, it starts at nine.' },
    },
  },
  {
    matches: ['seoul', 'korea', 'busan'],
    destination: 'Seoul',
    language: 'Korean',
    speechLocale: 'ko-KR',
    visual: 'city-night',
    cultureNote: 'Polite sentence endings matter in Korean; using -요 is an easy way to sound respectful without becoming stiff.',
    phrases: {
      cafe: { phrase: '창가 자리 부탁드려요.', pronunciation: 'chang-ga ja-ri bu-tak-deu-ryeo-yo', translation: 'A window seat, please.', reply: '네, 이쪽으로 오세요.', replyPronunciation: 'ne, i-jjok-eu-ro o-se-yo', replyTranslation: 'Yes, please come this way.' },
      directions: { phrase: '실례합니다, 역이 어디예요?', pronunciation: 'sil-lye-ham-ni-da, yeo-gi eo-di-ye-yo?', translation: 'Excuse me, where is the station?', reply: '쭉 가서 왼쪽이에요.', replyPronunciation: 'jjuk ga-seo oen-jjok-i-e-yo', replyTranslation: 'Go straight and it is on the left.' },
      arrival: { phrase: '예약했어요.', pronunciation: 'ye-yak-hae-sseo-yo', translation: 'I have a reservation.', reply: '성함이 어떻게 되세요?', replyPronunciation: 'seong-ham-i eo-tteo-ke doe-se-yo?', replyTranslation: 'What name is the reservation under?' },
      market: { phrase: '이거 여기서 만들었어요?', pronunciation: 'i-geo yeo-gi-seo man-deu-reo-sseo-yo?', translation: 'Was this made here?', reply: '네, 직접 만들었어요.', replyPronunciation: 'ne, jik-jeop man-deu-reo-sseo-yo', replyTranslation: 'Yes, it was handmade.' },
      evening: { phrase: '근처에 라이브 음악이 있어요?', pronunciation: 'geun-cheo-e ra-i-beu eu-mak-i i-sseo-yo?', translation: 'Is there live music nearby?', reply: '네, 아홉 시에 시작해요.', replyPronunciation: 'ne, a-hop si-e si-jak-hae-yo', replyTranslation: 'Yes, it starts at nine.' },
    },
  },
  {
    matches: ['mexico', 'madrid', 'barcelona', 'spain', 'bogota', 'buenos aires'],
    destination: 'Mexico City',
    language: 'Spanish',
    speechLocale: 'es-MX',
    visual: 'cafe',
    cultureNote: 'A quick buenos días or buenas tardes before a request is an easy sign of respect and friendliness.',
    phrases: {
      cafe: { phrase: '¿Me da una mesa afuera, por favor?', pronunciation: 'meh dah OO-nah MEH-sah ah-FWEH-rah, por fah-VOR', translation: 'Could I have a table outside, please?', reply: 'Claro, por aquí.', replyPronunciation: 'KLAH-roh, por ah-KEE', replyTranslation: 'Of course, this way.' },
      directions: { phrase: 'Disculpe, ¿cómo llego al metro?', pronunciation: 'dees-KOOL-peh, KOH-moh YEH-goh al MEH-troh', translation: 'Excuse me, how do I get to the metro?', reply: 'Siga derecho y gire a la izquierda.', replyPronunciation: 'SEE-gah deh-REH-choh ee HEE-reh ah lah ees-KYEHR-dah', replyTranslation: 'Go straight and turn left.' },
      arrival: { phrase: 'Hola, tengo una reserva.', pronunciation: 'OH-lah, TEN-goh OO-nah reh-SEHR-vah', translation: 'Hello, I have a reservation.', reply: 'Bienvenido. ¿A qué nombre?', replyPronunciation: 'byen-veh-NEE-doh. ah keh NOHM-breh?', replyTranslation: 'Welcome. Under what name?' },
      market: { phrase: '¿Esto está hecho aquí?', pronunciation: 'EHS-toh ehs-TAH EH-choh ah-KEE', translation: 'Is this made here?', reply: 'Sí, es de un artesano local.', replyPronunciation: 'see, ehs deh oon ar-teh-SAH-noh loh-KAHL', replyTranslation: 'Yes, it is by a local artisan.' },
      evening: { phrase: '¿Hay música en vivo cerca?', pronunciation: 'eye MOO-see-kah en VEE-voh SEHR-kah', translation: 'Is there live music nearby?', reply: 'Sí, empieza a las nueve.', replyPronunciation: 'see, em-PYEH-sah ah las NWEH-veh', replyTranslation: 'Yes, it starts at nine.' },
    },
  },
  {
    matches: ['paris', 'france', 'lyon'],
    destination: 'Paris',
    language: 'French',
    speechLocale: 'fr-FR',
    visual: 'old-city',
    cultureNote: 'Begin with bonjour or bonsoir before asking anything; skipping the greeting can feel abrupt in France.',
    phrases: {
      cafe: { phrase: 'Une table en terrasse, s’il vous plaît.', pronunciation: 'ewn tahbl on teh-RAHS, seel voo PLEH', translation: 'A table outside, please.', reply: 'Bien sûr, suivez-moi.', replyPronunciation: 'byen SEWR, swee-vay MWAH', replyTranslation: 'Of course, follow me.' },
      directions: { phrase: 'Excusez-moi, où est la station?', pronunciation: 'ex-kew-zay MWAH, oo eh lah stah-SYON', translation: 'Excuse me, where is the station?', reply: 'Tout droit, puis à gauche.', replyPronunciation: 'too DRWAH, pwee ah GOHSH', replyTranslation: 'Straight ahead, then left.' },
      arrival: { phrase: 'Bonsoir, j’ai une réservation.', pronunciation: 'bon-SWAHR, zhay ewn ray-zehr-vah-SYON', translation: 'Good evening, I have a reservation.', reply: 'Bienvenue. À quel nom?', replyPronunciation: 'byen-veh-NEW. ah kel NOM?', replyTranslation: 'Welcome. Under what name?' },
      market: { phrase: 'C’est fabriqué ici?', pronunciation: 'say fah-bree-KAY ee-SEE', translation: 'Is this made here?', reply: 'Oui, par un artisan du quartier.', replyPronunciation: 'wee, par uhn ar-tee-ZAHN dew kar-TYAY', replyTranslation: 'Yes, by a craftsperson from the neighborhood.' },
      evening: { phrase: 'Il y a de la musique live près d’ici?', pronunciation: 'eel yah deh lah mew-ZEEK live preh dee-SEE', translation: 'Is there live music near here?', reply: 'Oui, ça commence à neuf heures.', replyPronunciation: 'wee, sah koh-MAHNS ah nuhf UHR', replyTranslation: 'Yes, it starts at nine.' },
    },
  },
  {
    matches: ['marrakech', 'morocco', 'cairo', 'amman'],
    destination: 'Marrakech',
    language: 'Arabic',
    speechLocale: 'ar-MA',
    visual: 'old-city',
    cultureNote: 'Greetings are part of the conversation, not wasted time; a warm salam makes practical exchanges easier.',
    phrases: {
      cafe: { phrase: 'بغيت أتاي، عفاك.', pronunciation: 'bghit atay, afak', translation: 'I would like a tea, please.', reply: 'مرحبا، بالنعناع؟', replyPronunciation: 'marhba, b-nanaa?', replyTranslation: 'Of course. With mint?' },
      directions: { phrase: 'عفاك، فين المحطة؟', pronunciation: 'afak, fin l-mahatta?', translation: 'Excuse me, where is the station?', reply: 'نيشان ومن بعد ليسار.', replyPronunciation: 'nishan w men baad l-yasar', replyTranslation: 'Straight ahead, then left.' },
      arrival: { phrase: 'سلام، عندي حجز.', pronunciation: 'salam, andi hajz', translation: 'Hello, I have a reservation.', reply: 'مرحبا، باسم من؟', replyPronunciation: 'marhba, b-ism men?', replyTranslation: 'Welcome. Under what name?' },
      market: { phrase: 'هاد الشي مصنوع هنا؟', pronunciation: 'had shi masnoua hna?', translation: 'Was this made here?', reply: 'إيه، صناعة محلية.', replyPronunciation: 'iyyeh, sinaa mahalliya', replyTranslation: 'Yes, it is locally made.' },
      evening: { phrase: 'كاينة شي موسيقى حية قريبة؟', pronunciation: 'kayna shi musiqa hayya qriba?', translation: 'Is there live music nearby?', reply: 'إيه، كتبدا مع التسعود.', replyPronunciation: 'iyyeh, katbda maa t-tsoud', replyTranslation: 'Yes, it starts around nine.' },
    },
  },
  {
    matches: ['london', 'england', 'uk', 'britain'],
    destination: 'London',
    language: 'English',
    speechLocale: 'en-GB',
    visual: 'london',
    cultureNote: 'In Britain, “could I” and a quick “please” soften a request without making it overly formal.',
    phrases: englishPhrases,
  },
  {
    matches: ['new york', 'usa', 'united states', 'america'],
    destination: 'New York',
    language: 'English',
    speechLocale: 'en-US',
    visual: 'new-york',
    cultureNote: 'New Yorkers are often direct because the pace is fast; clear and friendly usually works better than elaborate.',
    phrases: englishPhrases,
  },
];

const momentCopy: Record<MiaSceneSituation, { title: string; setting: string }> = {
  cafe: { title: 'A table worth staying for', setting: 'You step into a neighborhood café at the edge of the evening rush. The room is busy, but not hurried.' },
  directions: { title: 'Find the way without losing the moment', setting: 'Your map has stopped being helpful. A local pauses nearby, and you have one natural opening to ask.' },
  arrival: { title: 'Arrive like you expected to be here', setting: 'You reach the front desk with your bag, your confirmation, and the first real exchange of the trip.' },
  market: { title: 'Ask about the story behind the object', setting: 'A small object catches your eye at a local market. The maker is there, and curiosity is the best opener.' },
  evening: { title: 'Let the city choose the next hour', setting: 'The planned part of the day is over. You want music, people, and one recommendation that is not in the guidebook.' },
};

const momentCopyRu: Record<MiaSceneSituation, { title: string; setting: string }> = {
  cafe: { title: 'Столик, за которым хочется задержаться', setting: 'Ты заходишь в небольшое кафе перед вечерним наплывом гостей. Вокруг оживлённо, но никто не спешит.' },
  directions: { title: 'Найти дорогу и не потерять момент', setting: 'Карта перестала помогать. Рядом останавливается местный житель — есть естественный повод обратиться.' },
  arrival: { title: 'Приехать так, будто тебя здесь ждали', setting: 'Ты подходишь к стойке с багажом, подтверждением и первым настоящим разговором этой поездки.' },
  market: { title: 'Узнать историю вещи', setting: 'На местном рынке тебя привлекает небольшая вещь. Мастер рядом, и любопытство — лучший способ начать.' },
  evening: { title: 'Позволить городу выбрать следующий час', setting: 'Планы на день закончились. Хочется музыки, людей и одного совета, которого нет в путеводителе.' },
};

const bridgePhrasesRu: Record<MiaSceneSituation, Phrase> = {
  cafe: { phrase: 'Could I have a table by the window, please?', pronunciation: '', translation: 'Можно столик у окна, пожалуйста?', reply: 'Of course. This way, please.', replyPronunciation: '', replyTranslation: 'Конечно. Проходите, пожалуйста.' },
  directions: { phrase: 'Excuse me, is this the right way to the station?', pronunciation: '', translation: 'Извините, это дорога к станции?', reply: 'Yes—keep going, then take the second left.', replyPronunciation: '', replyTranslation: 'Да, идите прямо, затем поверните на втором повороте налево.' },
  arrival: { phrase: 'Hi, I have a reservation under my name.', pronunciation: '', translation: 'Здравствуйте, у меня бронь на моё имя.', reply: 'Welcome. May I see your confirmation?', replyPronunciation: '', replyTranslation: 'Добро пожаловать. Можно посмотреть подтверждение?' },
  market: { phrase: 'These are beautiful. Are they made locally?', pronunciation: '', translation: 'Очень красиво. Это сделано здесь?', reply: 'Yes, they are made by an artist nearby.', replyPronunciation: '', replyTranslation: 'Да, это работа местного мастера.' },
  evening: { phrase: 'Is there somewhere nearby with live music?', pronunciation: '', translation: 'Поблизости есть место с живой музыкой?', reply: 'Try the little place around the corner—it starts at nine.', replyPronunciation: '', replyTranslation: 'Попробуйте небольшое место за углом — музыка начинается в девять.' },
};

function profileFor(destination: string): PlaceProfile | undefined {
  const normalized = destination.toLocaleLowerCase('en');
  return profiles.find((profile) => profile.matches.some((match) => normalized.includes(match)));
}

export function buildFallbackMiaScene(input: MiaSceneRequest): MiaSceneResponse {
  const profile = profileFor(input.destination);
  const isRu = input.uiLanguage === 'ru';
  const moment = (isRu ? momentCopyRu : momentCopy)[input.situation];
  const phrase = profile?.phrases[input.situation] ?? (isRu ? bridgePhrasesRu : englishPhrases)[input.situation];
  const destination = input.destination.trim() || profile?.destination || 'your destination';
  const mission = input.level === 'first-words'
    ? (isRu ? 'Произнеси первую фразу один раз в своём темпе. Главное — передать смысл.' : 'Say the first line once at your own pace. Getting the meaning across is the win.')
    : input.level === 'conversational'
      ? (isRu ? 'Скажи первую фразу, выслушай ответ и добавь одну деталь от себя.' : 'Say the first line, listen for the reply, then answer with one detail of your own.')
      : (isRu ? 'Сделай разговор своим: задай один уточняющий вопрос и продолжи естественно.' : 'Make the exchange yours: add one follow-up question and keep the conversation moving naturally.');

  return miaSceneResponseSchema.parse({
    destination,
    language: profile?.language ?? (isRu ? 'Английский · запасная сцена' : 'English · bridge scene'),
    title: moment.title,
    setting: `${moment.setting} ${isRu ? `Ты в городе ${destination}.` : `You are in ${destination}.`}`,
    ...phrase,
    cultureNote: profile?.cultureNote ?? (isRu
      ? 'Это честная запасная сцена на английском: Mia не будет выдумывать местный язык или правило этикета без генератора. Начни с приветствия и спроси, как эта фраза звучит естественно здесь.'
      : 'This is an honest English bridge scene: Mia will not invent a local phrase or etiquette rule while generation is unavailable. Begin with a greeting and ask how people would say it naturally here.'),
    mission,
    speechLocale: profile?.speechLocale ?? 'en',
    visual: profile?.visual ?? 'cafe',
  });
}

export function completeGeneratedMiaScene(
  generated: MiaSceneModelResponse,
  fallback: MiaSceneResponse,
): MiaSceneResponse {
  const language = generated.language.trim();
  const languageNames: Record<string, string> = {
    ar: 'Arabic',
    de: 'German',
    el: 'Greek',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    hi: 'Hindi',
    id: 'Indonesian',
    it: 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    nl: 'Dutch',
    pl: 'Polish',
    pt: 'Portuguese',
    ru: 'Russian',
    sv: 'Swedish',
    th: 'Thai',
    tr: 'Turkish',
    vi: 'Vietnamese',
    zh: 'Chinese',
  };
  const speechLocales: Record<string, string> = {
    arabic: 'ar',
    chinese: 'zh-CN',
    dutch: 'nl-NL',
    english: 'en',
    french: 'fr-FR',
    german: 'de-DE',
    greek: 'el-GR',
    hindi: 'hi-IN',
    indonesian: 'id-ID',
    italian: 'it-IT',
    japanese: 'ja-JP',
    korean: 'ko-KR',
    polish: 'pl-PL',
    portuguese: 'pt-PT',
    russian: 'ru-RU',
    spanish: 'es-ES',
    swedish: 'sv-SE',
    thai: 'th-TH',
    turkish: 'tr-TR',
    vietnamese: 'vi-VN',
  };
  const normalizedLanguage = languageNames[language.toLowerCase()]
    || (language.length <= 3 && fallback.speechLocale !== 'en' ? fallback.language : language);

  return miaSceneResponseSchema.parse({
    ...generated,
    // A language name is more useful in the UI than an occasional bare model
    // code such as "ja". The destination profile already knows that name.
    language: normalizedLanguage,
    speechLocale: generated.speechLocale?.trim()
      || speechLocales[normalizedLanguage.toLowerCase()]
      || fallback.speechLocale,
    visual: generated.visual || fallback.visual,
  });
}

export const MIA_SCENE_MEDIA: Record<
  MiaSceneResponse['visual'],
  { poster: string; video: string; position: string }
> = {
  mediterranean: { poster: '/ambience/stills/venice-night.jpg', video: '/ambience/venice-night.mp4', position: 'center center' },
  india: { poster: '/ambience/stills/in-palace.jpg', video: '/ambience/in-palace.mp4', position: 'center center' },
  'city-night': { poster: '/ambience/stills/city-night-bokeh.jpg', video: '/ambience/city-night-bokeh.mp4', position: 'center center' },
  london: { poster: '/ambience/stills/uk-bigben-night.jpg', video: '/ambience/uk-bigben-night.mp4', position: 'center center' },
  'new-york': { poster: '/ambience/stills/us-manhattan.jpg', video: '/ambience/us-manhattan.mp4', position: 'center center' },
  cafe: { poster: '/ambience/stills/woman-coffee.jpg', video: '/ambience/woman-coffee.mp4', position: 'center center' },
  'old-city': { poster: '/ambience/stills/cathedral-light.jpg', video: '/ambience/cathedral-light.mp4', position: 'center center' },
};
