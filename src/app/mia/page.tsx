'use client';

import Image from 'next/image';
import Link from 'next/link';
import LangToggle from '@/components/LangToggle';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import './mia-boho.css';

const SCENARIO_ICONS: MilaIconName[] = ['travel', 'cafe', 'conversation', 'sparkle', 'flower'];

export default function MiaBohoPage() {
  const { lang } = useI18n();
  const copy = lang === 'ru'
    ? {
        explore: 'Исследовать',
        how: 'Как это работает',
        signIn: 'Войти',
        eyebrow: 'ЯЗЫК ДЛЯ МЕСТ, КУДА ВЕДЁТ ЖИЗНЬ',
        title: 'Встречай мир',
        titleAccent: 'на его языке.',
        intro: 'Mia помогает подготовиться к поездке, найти нужные слова и глубже почувствовать место — где бы ты ни оказался.',
        primary: 'Поговорить с Gia',
        secondary: 'Выбрать язык',
        assurance: ['Голос или текст', 'Любой уровень', 'Для настоящей жизни'],
        phraseLabel: 'Мадрид · 18:42',
        phrase: '¿Nos sentamos aquí?',
        phraseTranslation: 'Сядем здесь?',
        phraseAction: 'Попробовать с Gia',
        momentsEyebrow: 'НЕ УЧЕБНИК. НАСТОЯЩАЯ ЖИЗНЬ.',
        momentsTitle: 'Практикуй моменты, ради которых путешествуешь.',
        scenarios: ['Найти дорогу', 'Заказать уверенно', 'Стать своим за столом', 'Понять шутку', 'Остаться ради истории'],
        productEyebrow: 'БОЛЬШЕ, ЧЕМ НУЖНЫЕ СЛОВА',
        productTitle: 'Говори так, чтобы тебя поняли — и почувствовали.',
        productBody: 'Mia соединяет живую практику, культурный контекст и помощь Gia с тоном, ритмом и произношением.',
        features: [
          ['01', 'Скажи как получается', 'Не строй идеальную фразу заранее — начни с тех слов, которые уже есть.'],
          ['02', 'Получи мягкую подсказку', 'Gia поправит только то, что действительно поможет в следующем разговоре.'],
          ['03', 'Пойми контекст', 'Узнай, что звучит тепло, вежливо, естественно или слишком формально именно здесь.'],
        ],
        culturalNote: 'Культурная заметка',
        demoPrompt: 'В Лиссабоне это прозвучит теплее как мягкое предложение.',
        demoReply: 'Que tal sentarmo-nos lá fora?',
        demoTranslation: 'Может, сядем снаружи?',
        cultureEyebrow: 'КУЛЬТУРА ЖИВЁТ МЕЖДУ СТРОК',
        cultureTitle: 'Язык — это путь внутрь места.',
        cultureBody: 'Исследуй не только перевод, но и то, как люди приветствуют, приглашают, шутят, заботятся и становятся ближе.',
        stories: [
          ['За общим столом', 'Слова, которыми делятся едой, временем и гостеприимством.', 'Джайпур · Хинди'],
          ['Город после заката', 'Как меняются тон, близость и разговор, когда день становится медленнее.', 'Венеция · Итальянский'],
          ['Новые люди, общий смысл', 'Как войти в разговор естественно — даже если язык пока неидеален.', 'Сеул · Корейский'],
        ],
        storyAction: 'Исследовать культуру в разговоре',
        companionEyebrow: 'ЗНАКОМЬСЯ: GIA — СОБЕСЕДНИЦА ВНУТРИ MIA.',
        companionTitle: 'Gia подстраивается под твой ритм.',
        companionBody: 'Говори естественно. Gia встречает тебя на твоём уровне, помнит, что ты изучаешь, и помогает, не разрушая момент.',
        companionFeatures: ['Голос', 'Текст', 'Культурные заметки', 'Мягкие исправления'],
        languagesTitle: 'Начни с одного. Сверни в другой.',
        languages: 'Испанский · Французский · Хинди · Итальянский · Японский · Португальский · Русский · Корейский · Арабский · Немецкий · и другие',
        learningNote: 'Нужен более структурный путь?',
        learningLink: 'Открыть уроки Mila',
        finalEyebrow: 'СЛЕДУЮЩЕЕ МЕСТО УЖЕ ЗОВЁТ',
        finalTitle: 'Уйди дальше, чем «привет».',
        finalBody: 'Новое место ощущается иначе, когда ты можешь говорить за себя.',
        finalAction: 'Поговорить с Gia',
        privacy: 'Конфиденциальность',
        terms: 'Условия',
        footerLine: 'Для путешественников, учеников и любопытных к миру.',
        imageAlts: ['Силуэт дворца на закате', 'Тихая улица Венеции вечером', 'Люди учатся вместе за столом'],
      }
    : {
        explore: 'Explore',
        how: 'How it works',
        signIn: 'Sign in',
        eyebrow: 'LANGUAGE FOR WHERE LIFE TAKES YOU',
        title: 'Meet the world',
        titleAccent: 'in its own words.',
        intro: 'Mia helps you prepare for the journey, find the words, and understand a place more deeply—wherever you land.',
        primary: 'Talk with Gia',
        secondary: 'Choose a language',
        assurance: ['Voice or text', 'Any level', 'Made for real life'],
        phraseLabel: 'Madrid · 18:42',
        phrase: '¿Nos sentamos aquí?',
        phraseTranslation: 'Shall we sit here?',
        phraseAction: 'Try it with Gia',
        momentsEyebrow: 'NOT A TEXTBOOK. REAL LIFE.',
        momentsTitle: 'Practice the moments you actually travel for.',
        scenarios: ['Find your way', 'Order with confidence', 'Join the table', 'Understand the joke', 'Stay for the story'],
        productEyebrow: 'MORE THAN THE RIGHT WORDS',
        productTitle: 'Speak so people understand you—and feel you.',
        productBody: 'Mia brings together real conversation, cultural context, and Gia’s help with tone, timing, and pronunciation.',
        features: [
          ['01', 'Say it as it comes', 'Do not wait for the perfect sentence. Begin with the words you already have.'],
          ['02', 'Get a gentle nudge', 'Gia corrects only what will genuinely help in your next conversation.'],
          ['03', 'Read the context', 'Learn what sounds warm, polite, natural, or too formal in this particular place.'],
        ],
        culturalNote: 'Culture note',
        demoPrompt: 'In Lisbon, this sounds warmer when phrased as a suggestion.',
        demoReply: 'Que tal sentarmo-nos lá fora?',
        demoTranslation: 'How about we sit outside?',
        cultureEyebrow: 'CULTURE LIVES BETWEEN THE LINES',
        cultureTitle: 'A language is a way into a place.',
        cultureBody: 'Explore more than translation: how people welcome, invite, joke, care, and grow closer.',
        stories: [
          ['Around the table', 'The words people use to share food, time, and hospitality.', 'Jaipur · Hindi'],
          ['The city after dark', 'How tone, closeness, and conversation change when the day slows down.', 'Venice · Italian'],
          ['New people, shared meaning', 'How to enter a conversation naturally—even before your language is perfect.', 'Seoul · Korean'],
        ],
        storyAction: 'Explore culture through conversation',
        companionEyebrow: 'MEET GIA — THE COMPANION INSIDE MIA.',
        companionTitle: 'Gia moves at your pace.',
        companionBody: 'Speak naturally. Gia meets your level, remembers what you are learning, and helps without interrupting the moment.',
        companionFeatures: ['Voice', 'Text', 'Culture notes', 'Gentle corrections'],
        languagesTitle: 'Start with one. Wander into another.',
        languages: 'Spanish · French · Hindi · Italian · Japanese · Portuguese · Russian · Korean · Arabic · German · and more',
        learningNote: 'Want a more structured path?',
        learningLink: 'Explore lessons in Mila',
        finalEyebrow: 'THE NEXT PLACE IS ALREADY CALLING',
        finalTitle: 'Go further than hello.',
        finalBody: 'The next place feels different when you can speak for yourself.',
        finalAction: 'Talk with Gia',
        privacy: 'Privacy',
        terms: 'Terms',
        footerLine: 'For travelers, learners, and the culture-curious.',
        imageAlts: ['A palace silhouette at sunset', 'A quiet Venice street at night', 'People learning together around a table'],
      };

  const storyImages = [
    '/ambience/stills/in-palace.jpg',
    '/ambience/stills/venice-night.jpg',
    '/ambience/stills/woman-cafe-laptop.jpg',
  ];

  return (
    <div className="mia-boho">
      <a className="mia-boho__skip" href="#mia-main">
        {lang === 'ru' ? 'К содержанию' : 'Skip to content'}
      </a>

      <header className="mia-boho__nav">
        <Link className="mia-boho__brand" href="/" aria-label="Mia home">
          <span aria-hidden="true">M</span>
          <strong>Mia</strong>
          <small>{lang === 'ru' ? 'язык · путешествия · культура' : 'language · travel · culture'}</small>
        </Link>
        <nav aria-label={lang === 'ru' ? 'Навигация' : 'Primary navigation'}>
          <a href="#explore">{copy.explore}</a>
          <a href="#how">{copy.how}</a>
        </nav>
        <div className="mia-boho__nav-actions">
          <LangToggle />
          <Link className="mia-boho__signin" href="https://gia.purangpt.com/login?returnTo=%2Fchat">{copy.signIn}</Link>
        </div>
      </header>

      <main id="mia-main">
        <section className="mia-boho__hero" aria-labelledby="mia-hero-title">
          <div className="mia-boho__hero-copy">
            <p className="mia-boho__eyebrow"><span aria-hidden="true" />{copy.eyebrow}</p>
            <h1 id="mia-hero-title">
              {copy.title}
              <em>{copy.titleAccent}</em>
            </h1>
            <p className="mia-boho__hero-intro">{copy.intro}</p>
            <div className="mia-boho__actions">
              <Link className="mia-boho__button mia-boho__button--primary" href="https://gia.purangpt.com/chat">
                {copy.primary}<MilaIcon name="arrow" size={19} />
              </Link>
              <a className="mia-boho__button mia-boho__button--secondary" href="#languages">
                {copy.secondary}
              </a>
            </div>
            <ul className="mia-boho__assurance" aria-label={lang === 'ru' ? 'Возможности Mia' : 'What Mia offers'}>
              {copy.assurance.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <div className="mia-boho__hero-art" aria-hidden="true">
            <Image
              src="/visuals/v3/mila-boho-editorial-desktop-v1.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 820px) 100vw, 50vw"
            />
            <span className="mia-boho__hero-thread" />
          </div>

          <aside className="mia-boho__phrase-card" aria-label={copy.phraseTranslation}>
            <p>{copy.phraseLabel}</p>
            <strong lang="es">{copy.phrase}</strong>
            <span>{copy.phraseTranslation}</span>
            <Link href="https://gia.purangpt.com/chat">{copy.phraseAction}<MilaIcon name="arrow" size={16} /></Link>
          </aside>
        </section>

        <section className="mia-boho__moments" id="explore" aria-labelledby="mia-moments-title">
          <div>
            <p className="mia-boho__section-label">{copy.momentsEyebrow}</p>
            <h2 id="mia-moments-title">{copy.momentsTitle}</h2>
          </div>
          <div className="mia-boho__scenario-rail">
            {copy.scenarios.map((scenario, index) => (
              <article key={scenario}>
                <MilaIcon name={SCENARIO_ICONS[index]} size={22} />
                <span>0{index + 1}</span>
                <strong>{scenario}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="mia-boho__product" id="how" aria-labelledby="mia-product-title">
          <div className="mia-boho__product-copy">
            <p className="mia-boho__section-label">{copy.productEyebrow}</p>
            <h2 id="mia-product-title">{copy.productTitle}</h2>
            <p>{copy.productBody}</p>
            <div className="mia-boho__feature-list">
              {copy.features.map(([number, title, body]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div><strong>{title}</strong><p>{body}</p></div>
                </article>
              ))}
            </div>
          </div>

          <div className="mia-boho__demo" aria-label={copy.culturalNote}>
            <div className="mia-boho__demo-topline">
              <span><i />Gia · Lisbon</span>
              <small>PT · A2</small>
            </div>
            <div className="mia-boho__wave" aria-hidden="true">
              {[34, 62, 45, 88, 58, 76, 40, 68, 51, 82, 38, 64].map((height, index) => (
                <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>
            <blockquote>
              <p lang="pt">{copy.demoReply}</p>
              <footer>{copy.demoTranslation}</footer>
            </blockquote>
            <div className="mia-boho__culture-note">
              <MilaIcon name="flower" size={19} />
              <p><strong>{copy.culturalNote}</strong>{copy.demoPrompt}</p>
            </div>
            <Link href="https://gia.purangpt.com/darshan">
              <MilaIcon name="voice" size={18} />{lang === 'ru' ? 'Попробовать голосом' : 'Try it by voice'}
            </Link>
          </div>
        </section>

        <section className="mia-boho__culture" aria-labelledby="mia-culture-title">
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
          <Link className="mia-boho__text-link" href="https://gia.purangpt.com/chat">
            {copy.storyAction}<MilaIcon name="arrow" size={17} />
          </Link>
        </section>

        <section className="mia-boho__companion" aria-labelledby="mia-companion-title">
          <div>
            <p className="mia-boho__section-label">{copy.companionEyebrow}</p>
            <h2 id="mia-companion-title">{copy.companionTitle}</h2>
          </div>
          <div>
            <p>{copy.companionBody}</p>
            <ul>
              {copy.companionFeatures.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </div>
        </section>

        <section className="mia-boho__languages" id="languages" aria-labelledby="mia-languages-title">
          <span aria-hidden="true">G</span>
          <div>
            <p className="mia-boho__section-label">{lang === 'ru' ? 'МИР НЕ ГОВОРИТ НА ОДНОМ ЯЗЫКЕ' : 'THE WORLD DOES NOT SPEAK JUST ONE LANGUAGE'}</p>
            <h2 id="mia-languages-title">{copy.languagesTitle}</h2>
            <p>{copy.languages}</p>
          </div>
          <aside>
            <p>{copy.learningNote}</p>
            <Link href="https://mila.purangpt.com/start">{copy.learningLink}<MilaIcon name="arrow" size={16} /></Link>
          </aside>
        </section>

        <section className="mia-boho__final" aria-labelledby="mia-final-title">
          <p className="mia-boho__section-label">{copy.finalEyebrow}</p>
          <h2 id="mia-final-title">{copy.finalTitle}</h2>
          <p>{copy.finalBody}</p>
          <Link className="mia-boho__button mia-boho__button--primary" href="https://gia.purangpt.com/chat">
            {copy.finalAction}<MilaIcon name="arrow" size={19} />
          </Link>
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
