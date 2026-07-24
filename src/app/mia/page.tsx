'use client';

import Image from 'next/image';
import Link from 'next/link';
import LangToggle from '@/components/LangToggle';
import MiaSceneGenerator from '@/components/mia/MiaSceneGenerator';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import './mia-boho.css';

const MOMENT_ICONS: MilaIconName[] = ['travel', 'cafe', 'conversation', 'sparkle', 'flower'];

export default function MiaBohoPage() {
  const { lang } = useI18n();
  const copy = lang === 'ru'
    ? {
        sceneNav: 'Места',
        cultureNav: 'Культура',
        howNav: 'Как это работает',
        eyebrow: 'ЯЗЫК ДЛЯ МЕСТ, КУДА ВЕДЁТ ЖИЗНЬ',
        title: 'Встречай мир',
        titleAccent: 'на его языке.',
        intro: 'Mia начинает не с урока, а с места. Почувствуй утро в Джайпуре, дождливый Убуд или ночной Токио — а затем выучи слова, которые действительно понадобятся там.',
        primary: 'Выбрать место',
        secondary: 'Посмотреть живые моменты',
        assurance: ['Индия и Бали в фокусе', 'Любой уровень', 'Работает на месте'],
        phraseLabel: 'Джайпур · 08:10',
        phrase: 'नमस्ते, यहाँ की खास चाय कौन-सी है?',
        phraseTranslation: 'Здравствуйте, какой чай здесь особенный?',
        phraseAction: 'Открыть эту сцену',
        momentsEyebrow: 'НЕ УЧЕБНИК. ОЩУЩЕНИЕ МЕСТА.',
        momentsTitle: 'Учись внутри моментов, ради которых путешествуешь.',
        moments: ['Войти в ритм', 'Заказать уверенно', 'Заговорить с местными', 'Понять ответ', 'Остаться ради истории'],
        howEyebrow: 'ОДНА СЦЕНА. ТРИ СЛОЯ.',
        howTitle: 'Не заучивай фразы. Репетируй реальность.',
        howBody: 'Mia соединяет практическую речь, вероятный ответ и контекст места — чтобы фраза не исчезла в тот момент, когда она нужна.',
        features: [
          ['01', 'Скажи главное', 'Короткая естественная фраза для конкретного момента — без перегруженного урока.'],
          ['02', 'Узнай ответ', 'Услышь реалистичную следующую реплику, а не только собственную заготовку.'],
          ['03', 'Прочитай контекст', 'Пойми тон, ритм и маленький культурный сигнал, который переводчик обычно пропускает.'],
        ],
        cultureEyebrow: 'КУЛЬТУРА ЖИВЁТ МЕЖДУ СТРОК',
        cultureTitle: 'Язык — это путь внутрь места.',
        cultureBody: 'Не открытки и стереотипы, а внимание к ритму дня, обычным приветствиям и тому, как люди делятся своим местом.',
        stories: [
          ['Утро начинается с чая', 'Поздоровайся, спроси о местном вкусе и позволь разговору начаться естественно.', 'Джайпур · Хинди'],
          ['После тёплого дождя', 'Слова для кофе, мастерских и неспешного разговора по дороге через Убуд.', 'Убуд · Индонезийский'],
          ['Последний поезд, первая фраза', 'Вежливо спроси дорогу и научись узнавать ответ в ритме станции.', 'Токио · Японский'],
        ],
        languagesEyebrow: 'МИР НЕ ГОВОРИТ НА ОДНОМ ЯЗЫКЕ',
        languagesTitle: 'Начни с места. Язык появится следом.',
        languages: 'Хинди · Индонезийский · Японский · Португальский · Испанский · Корейский · Французский · Арабский · Английский · и другие',
        finalEyebrow: 'СЛЕДУЮЩЕЕ МЕСТО УЖЕ ЗОВЁТ',
        finalTitle: 'Зайди дальше, чем «привет».',
        finalBody: 'Новое место ощущается иначе, когда у тебя уже есть первая настоящая сцена.',
        finalAction: 'Создать мою сцену',
        privacy: 'Конфиденциальность',
        terms: 'Условия',
        footerLine: 'Для путешественников и любопытных к миру.',
        heroAlt: 'Путевые впечатления из Индии, Бали и других мест мира',
        imageAlts: ['Утренний свет во дворце Джайпура', 'Зелёный вулканический пейзаж Бали', 'Огни Токио вечером'],
      }
    : {
        sceneNav: 'Places',
        cultureNav: 'Culture',
        howNav: 'How it works',
        eyebrow: 'LANGUAGE FOR WHERE LIFE TAKES YOU',
        title: 'Meet the world',
        titleAccent: 'in its own words.',
        intro: 'Mia begins with the place, not the lesson. Feel a Jaipur morning, rain-washed Ubud, or Tokyo after dark—then learn the words you will actually need there.',
        primary: 'Choose a place',
        secondary: 'Explore living moments',
        assurance: ['India & Bali in focus', 'Any confidence level', 'Useful on the ground'],
        phraseLabel: 'Jaipur · 08:10',
        phrase: 'नमस्ते, यहाँ की खास चाय कौन-सी है?',
        phraseTranslation: 'Hello, which tea is special here?',
        phraseAction: 'Open this scene',
        momentsEyebrow: 'NOT A TEXTBOOK. A SENSE OF PLACE.',
        momentsTitle: 'Learn inside the moments you actually travel for.',
        moments: ['Enter the rhythm', 'Order with confidence', 'Talk with locals', 'Understand the reply', 'Stay for the story'],
        howEyebrow: 'ONE SCENE. THREE LAYERS.',
        howTitle: 'Do not memorize phrases. Rehearse reality.',
        howBody: 'Mia brings together useful language, the likely reply, and the context of the place—so the words are still there when the moment arrives.',
        features: [
          ['01', 'Say what matters', 'One short, natural line for this exact moment—without turning the trip into a lesson.'],
          ['02', 'Recognize what comes back', 'Hear a plausible next reply, not only the sentence you prepared.'],
          ['03', 'Read the context', 'Catch the tone, rhythm, and small cultural signal a translator usually leaves out.'],
        ],
        cultureEyebrow: 'CULTURE LIVES BETWEEN THE LINES',
        cultureTitle: 'A language is a way into a place.',
        cultureBody: 'Not postcards or stereotypes—an invitation to notice the rhythm of a day, ordinary greetings, and how people share their place.',
        stories: [
          ['Morning begins with chai', 'Greet first, ask about a local flavor, and let the exchange open naturally.', 'Jaipur · Hindi'],
          ['After the warm rain', 'Words for coffee, craft studios, and an unhurried conversation through Ubud.', 'Ubud · Indonesian'],
          ['Last train, first phrase', 'Ask the way politely and learn to catch the answer inside station rhythm.', 'Tokyo · Japanese'],
        ],
        languagesEyebrow: 'THE WORLD DOES NOT SPEAK JUST ONE LANGUAGE',
        languagesTitle: 'Begin with the place. Let the language follow.',
        languages: 'Hindi · Indonesian · Japanese · Portuguese · Spanish · Korean · French · Arabic · English · and more',
        finalEyebrow: 'THE NEXT PLACE IS ALREADY CALLING',
        finalTitle: 'Go further than hello.',
        finalBody: 'The next place feels different when you already have one real scene in your pocket.',
        finalAction: 'Generate my scene',
        privacy: 'Privacy',
        terms: 'Terms',
        footerLine: 'For travelers and the culture-curious.',
        heroAlt: 'Travel moments from India, Bali, and places around the world',
        imageAlts: ['Morning light inside a Jaipur palace', 'A green volcanic landscape in Bali', 'Tokyo lights after dark'],
      };

  const storyImages = [
    '/ambience/stills/in-palace.jpg',
    '/ambience/stills/nature-volcano.jpg',
    '/ambience/stills/city-night-bokeh.jpg',
  ];

  return (
    <div className="mia-boho">
      <a className="mia-boho__skip" href="#mia-main">{lang === 'ru' ? 'К содержанию' : 'Skip to content'}</a>

      <header className="mia-boho__nav">
        <Link className="mia-boho__brand" href="/" aria-label="Mia home">
          <span aria-hidden="true">M</span>
          <strong>Mia</strong>
          <small>{lang === 'ru' ? 'путешествия · язык · культура' : 'travel · language · culture'}</small>
        </Link>
        <nav aria-label={lang === 'ru' ? 'Навигация' : 'Primary navigation'}>
          <a href="#destinations">{copy.sceneNav}</a>
          <a href="#culture">{copy.cultureNav}</a>
          <a href="#how">{copy.howNav}</a>
        </nav>
        <div className="mia-boho__nav-actions"><LangToggle /></div>
      </header>

      <main id="mia-main">
        <section className="mia-boho__hero" aria-labelledby="mia-hero-title">
          <div className="mia-boho__hero-copy">
            <p className="mia-boho__eyebrow"><span aria-hidden="true" />{copy.eyebrow}</p>
            <h1 id="mia-hero-title">{copy.title}<em>{copy.titleAccent}</em></h1>
            <p className="mia-boho__hero-intro">{copy.intro}</p>
            <div className="mia-boho__actions">
              <a className="mia-boho__button mia-boho__button--primary" href="#destinations">
                {copy.primary}<MilaIcon name="arrow" size={19} />
              </a>
              <a className="mia-boho__button mia-boho__button--secondary" href="#moments">{copy.secondary}</a>
            </div>
            <ul className="mia-boho__assurance" aria-label={lang === 'ru' ? 'Возможности Mia' : 'What Mia offers'}>
              {copy.assurance.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <div className="mia-boho__hero-art">
            <Image
              className="mia-boho__hero-scene"
              src="/mia-og-v2.jpg"
              alt={copy.heroAlt}
              fill
              priority
              sizes="(max-width: 820px) 100vw, 50vw"
            />
            <span className="mia-boho__hero-thread" aria-hidden="true" />
          </div>

          <aside className="mia-boho__phrase-card" aria-label={copy.phraseTranslation}>
            <p>{copy.phraseLabel}</p>
            <strong lang="pt">{copy.phrase}</strong>
            <span>{copy.phraseTranslation}</span>
            <a href="#scene-studio">{copy.phraseAction}<MilaIcon name="arrow" size={16} /></a>
          </aside>
        </section>

        <MiaSceneGenerator lang={lang} />

        <section className="mia-boho__moments" id="moments" aria-labelledby="mia-moments-title">
          <div>
            <p className="mia-boho__section-label">{copy.momentsEyebrow}</p>
            <h2 id="mia-moments-title">{copy.momentsTitle}</h2>
          </div>
          <div className="mia-boho__scenario-rail">
            {copy.moments.map((moment, index) => (
              <a href="#scene-studio" key={moment}>
                <MilaIcon name={MOMENT_ICONS[index]} size={22} />
                <span>0{index + 1}</span>
                <strong>{moment}</strong>
              </a>
            ))}
          </div>
        </section>

        <section className="mia-boho__product" id="how" aria-labelledby="mia-product-title">
          <div className="mia-boho__product-copy">
            <p className="mia-boho__section-label">{copy.howEyebrow}</p>
            <h2 id="mia-product-title">{copy.howTitle}</h2>
            <p>{copy.howBody}</p>
          </div>
          <div className="mia-boho__feature-list">
            {copy.features.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <div><strong>{title}</strong><p>{body}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="mia-boho__culture" id="culture" aria-labelledby="mia-culture-title">
          <header>
            <div>
              <p className="mia-boho__section-label">{copy.cultureEyebrow}</p>
              <h2 id="mia-culture-title">{copy.cultureTitle}</h2>
            </div>
            <p>{copy.cultureBody}</p>
          </header>
          <div className="mia-boho__stories">
            {copy.stories.map(([title, body, meta], index) => (
              <article key={title}>
                <div className="mia-boho__story-image">
                  <Image src={storyImages[index]} alt={copy.imageAlts[index]} fill sizes="(max-width: 760px) 100vw, 33vw" />
                </div>
                <p>{meta}</p>
                <h3>{title}</h3>
                <span>{body}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="mia-boho__languages" aria-labelledby="mia-languages-title">
          <span aria-hidden="true">M</span>
          <div>
            <p className="mia-boho__section-label">{copy.languagesEyebrow}</p>
            <h2 id="mia-languages-title">{copy.languagesTitle}</h2>
            <p>{copy.languages}</p>
          </div>
          <aside>
            <p>{lang === 'ru' ? 'Куда ты едешь дальше?' : 'Where are you going next?'}</p>
            <a href="#scene-studio">{copy.primary}<MilaIcon name="arrow" size={16} /></a>
          </aside>
        </section>

        <section className="mia-boho__final" aria-labelledby="mia-final-title">
          <p className="mia-boho__section-label">{copy.finalEyebrow}</p>
          <h2 id="mia-final-title">{copy.finalTitle}</h2>
          <p>{copy.finalBody}</p>
          <a className="mia-boho__button mia-boho__button--primary" href="#destinations">
            {copy.finalAction}<MilaIcon name="arrow" size={19} />
          </a>
        </section>
      </main>

      <footer className="mia-boho__footer">
        <div className="mia-boho__brand">
          <span aria-hidden="true">M</span><strong>Mia</strong><small>{copy.footerLine}</small>
        </div>
        <nav aria-label={lang === 'ru' ? 'Юридические ссылки' : 'Legal'}>
          <Link href="/privacy">{copy.privacy}</Link>
          <Link href="/terms">{copy.terms}</Link>
        </nav>
        <span>© {new Date().getFullYear()} Mia</span>
      </footer>
    </div>
  );
}
