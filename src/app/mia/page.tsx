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
        sceneNav: 'Студия сцен',
        cultureNav: 'Культура',
        howNav: 'Как это работает',
        eyebrow: 'ЯЗЫК ДЛЯ МЕСТ, КУДА ВЕДЁТ ЖИЗНЬ',
        title: 'Встречай мир',
        titleAccent: 'на его языке.',
        intro: 'Mia превращает следующую поездку в живые моменты: нужные слова, возможный ответ и культурный нюанс, который помогает почувствовать место.',
        primary: 'Создать сцену поездки',
        secondary: 'Посмотреть моменты',
        assurance: ['Без регистрации', 'Любой уровень', 'Работает на месте'],
        phraseLabel: 'Лиссабон · 18:42',
        phrase: 'Podia trazer-me um café, por favor?',
        phraseTranslation: 'Можно мне кофе, пожалуйста?',
        phraseAction: 'Открыть эту сцену',
        momentsEyebrow: 'НЕ УЧЕБНИК. НАСТОЯЩАЯ ЖИЗНЬ.',
        momentsTitle: 'Подготовься к моментам, ради которых путешествуешь.',
        moments: ['Найти дорогу', 'Заказать уверенно', 'Начать разговор', 'Понять ответ', 'Остаться ради истории'],
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
        cultureBody: 'Не коллекция стереотипов, а внимание к тому, как люди приветствуют, приглашают, шутят и делятся своим городом.',
        stories: [
          ['За общим столом', 'Слова, которыми делятся едой, временем и гостеприимством.', 'Джайпур · Хинди'],
          ['Город после заката', 'Как меняются тон и разговор, когда день становится медленнее.', 'Венеция · Итальянский'],
          ['Новые люди, общий смысл', 'Как войти в разговор естественно, даже если язык пока неидеален.', 'Сеул · Корейский'],
        ],
        languagesEyebrow: 'МИР НЕ ГОВОРИТ НА ОДНОМ ЯЗЫКЕ',
        languagesTitle: 'Начни с места. Язык появится следом.',
        languages: 'Испанский · Французский · Хинди · Итальянский · Японский · Португальский · Корейский · Арабский · Английский · и другие',
        finalEyebrow: 'СЛЕДУЮЩЕЕ МЕСТО УЖЕ ЗОВЁТ',
        finalTitle: 'Зайди дальше, чем «привет».',
        finalBody: 'Новое место ощущается иначе, когда у тебя уже есть первая настоящая сцена.',
        finalAction: 'Создать мою сцену',
        privacy: 'Конфиденциальность',
        terms: 'Условия',
        footerLine: 'Для путешественников и любопытных к миру.',
        heroAlt: 'Тёплая улица средиземноморского города в сумерках',
        imageAlts: ['Силуэт дворца на закате', 'Тихая улица Венеции вечером', 'Люди встречаются за столом'],
      }
    : {
        sceneNav: 'Scene studio',
        cultureNav: 'Culture',
        howNav: 'How it works',
        eyebrow: 'LANGUAGE FOR WHERE LIFE TAKES YOU',
        title: 'Meet the world',
        titleAccent: 'in its own words.',
        intro: 'Mia turns your next trip into vivid, usable moments: the words to begin, the reply you may hear, and the cultural cue that helps you feel the place.',
        primary: 'Generate a travel scene',
        secondary: 'Explore the moments',
        assurance: ['No sign-up', 'Any confidence level', 'Useful on the ground'],
        phraseLabel: 'Lisbon · 18:42',
        phrase: 'Podia trazer-me um café, por favor?',
        phraseTranslation: 'Could you bring me a coffee, please?',
        phraseAction: 'Open this scene',
        momentsEyebrow: 'NOT A TEXTBOOK. REAL LIFE.',
        momentsTitle: 'Prepare for the moments you actually travel for.',
        moments: ['Find the way', 'Order with confidence', 'Start the conversation', 'Understand the reply', 'Stay for the story'],
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
        cultureBody: 'Not a collection of stereotypes—an invitation to notice how people welcome, invite, joke, and share their city.',
        stories: [
          ['Around the table', 'The words people use to share food, time, and hospitality.', 'Jaipur · Hindi'],
          ['The city after dark', 'How tone and conversation change when the day slows down.', 'Venice · Italian'],
          ['New people, shared meaning', 'How to enter a conversation naturally, even before your language is perfect.', 'Seoul · Korean'],
        ],
        languagesEyebrow: 'THE WORLD DOES NOT SPEAK JUST ONE LANGUAGE',
        languagesTitle: 'Begin with the place. Let the language follow.',
        languages: 'Spanish · French · Hindi · Italian · Japanese · Portuguese · Korean · Arabic · English · and more',
        finalEyebrow: 'THE NEXT PLACE IS ALREADY CALLING',
        finalTitle: 'Go further than hello.',
        finalBody: 'The next place feels different when you already have one real scene in your pocket.',
        finalAction: 'Generate my scene',
        privacy: 'Privacy',
        terms: 'Terms',
        footerLine: 'For travelers and the culture-curious.',
        heroAlt: 'A warm Mediterranean hill town at dusk',
        imageAlts: ['A palace silhouette at sunset', 'A quiet Venice street at night', 'People meeting around a table'],
      };

  const storyImages = [
    '/ambience/stills/in-palace.jpg',
    '/ambience/stills/venice-night.jpg',
    '/ambience/stills/woman-cafe-laptop.jpg',
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
          <a href="#scene-studio">{copy.sceneNav}</a>
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
              <a className="mia-boho__button mia-boho__button--primary" href="#scene-studio">
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
              src="/mia-og.png"
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
          <a className="mia-boho__button mia-boho__button--primary" href="#scene-studio">
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
