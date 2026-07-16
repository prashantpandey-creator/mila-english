'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

type IconName = 'sound' | 'path' | 'voice' | 'spark' | 'book' | 'chart' | 'arrow' | 'play' | 'lock' | 'check';
type DemoKey = 'uk' | 'us' | 'in';
type DemoPhase = 'ready' | 'analysing' | 'result';

const DEMOS = {
  uk: {
    code: 'LDN', place: 'London', dialect: 'British English', voice: 'en-GB',
    word: 'comfortable', ipa: '/ˈkʌm.fə.tə.bəl/', score: 92,
    chunks: ['com', 'fort', 'a', 'ble'], focus: 1,
    note: {
      ru: 'Отличная ясность. Смягчи /f/ и сделай средний слог легче.',
      en: 'Great clarity. Soften the /f/ and keep the middle syllable light.',
    },
  },
  us: {
    code: 'NYC', place: 'New York', dialect: 'American English', voice: 'en-US',
    word: 'thought', ipa: '/θɔːt/', score: 88,
    chunks: ['th', 'ough', 't'], focus: 0,
    note: {
      ru: 'Хороший ритм. Помести кончик языка между зубами для чистого /θ/.',
      en: 'Strong rhythm. Place the tip of your tongue between your teeth for a clean /θ/.',
    },
  },
  in: {
    code: 'BOM', place: 'Mumbai', dialect: 'Indian English', voice: 'en-IN',
    word: 'world', ipa: '/wɜːld/', score: 90,
    chunks: ['w', 'or', 'ld'], focus: 1,
    note: {
      ru: 'Хорошее начало. Удержи долгий гласный и закончи мягким /ld/.',
      en: 'A strong start. Hold the central vowel, then finish with a light /ld/.',
    },
  },
} as const;

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
  };

  if (name === 'sound') return <svg {...common}><path d="M4 14h3l4 4V6L7 10H4z"/><path d="M15 9.5a4 4 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/></svg>;
  if (name === 'path') return <svg {...common}><path d="M5 19c4-7 10-7 14-14"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="m12 5 2 2-2 2"/></svg>;
  if (name === 'voice') return <svg {...common}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.3 4.1L17 9l-3.7 1.9L12 15l-1.3-4.1L7 9l3.7-1.9z"/><path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z"/></svg>;
  if (name === 'book') return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21z"/></svg>;
  if (name === 'chart') return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
  if (name === 'play') return <svg {...common} fill="currentColor" stroke="none"><path d="m9 7 8 5-8 5z"/></svg>;
  if (name === 'lock') return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
  return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
}

function StoryVisual({ kind, lang }: { kind: 'speak' | 'understand' | 'improve'; lang: 'ru' | 'en' }) {
  if (kind === 'speak') {
    return (
      <div className="story-ui story-ui--speak" aria-hidden>
        <div className="story-ui__status"><i />{lang === 'ru' ? 'Голос распознан' : 'Voice captured'}</div>
        <div className="story-wave">
          {[28, 46, 30, 66, 42, 78, 52, 88, 38, 68, 44, 76, 34, 54, 26].map((h, i) => <i key={i} style={{ height: h }} />)}
        </div>
        <p>“I’d like to feel more confident in meetings.”</p>
      </div>
    );
  }

  if (kind === 'understand') {
    return (
      <div className="story-ui story-ui--understand" aria-hidden>
        <div className="story-ui__label">{lang === 'ru' ? 'Карта произношения' : 'Pronunciation map'}</div>
        <div className="story-phrase"><span>I’d</span><span className="is-clear">like</span><span>to</span><span className="is-focus">feel</span><span>more</span><span className="is-clear">confident</span></div>
        <div className="story-insight"><span>/f/</span><p>{lang === 'ru' ? 'Сделай атаку мягче и короче' : 'Use a softer, shorter onset'}</p></div>
      </div>
    );
  }

  return (
    <div className="story-ui story-ui--improve" aria-hidden>
      <div className="story-ui__label">{lang === 'ru' ? 'Следующая практика' : 'Your next practice'}</div>
      <div className="story-plan-row"><span><Icon name="voice" size={16}/>{lang === 'ru' ? 'Произношение' : 'Pronunciation'}</span><strong>7 min</strong></div>
      <div className="story-plan-row"><span><Icon name="spark" size={16}/>{lang === 'ru' ? 'Разговор' : 'Conversation'}</span><strong>3 min</strong></div>
      <div className="story-plan-row is-done"><span><Icon name="check" size={16}/>{lang === 'ru' ? 'Повторить завтра' : 'Review tomorrow'}</span><strong>09:00</strong></div>
    </div>
  );
}

function RoomVisual({ id }: { id: string }) {
  if (id === 'pronunciation') return (
    <div className="room-visual room-visual--pronunciation" aria-hidden>
      <div className="room-mini-word"><span>thought</span><small>/θɔːt/</small></div>
      <div className="room-mini-phonemes"><i className="is-focus">th</i><i>ough</i><i>t</i></div>
      <div className="room-mini-meter"><span style={{ width: '88%' }} /></div>
    </div>
  );
  if (id === 'course') return (
    <div className="room-visual room-visual--course" aria-hidden>
      <div><i>01</i><span>Warm-up</span><b /></div><div><i>02</i><span>Useful phrases</span><b /></div><div><i>03</i><span>Speak</span><b /></div>
    </div>
  );
  if (id === 'mentor') return (
    <div className="room-visual room-visual--mentor" aria-hidden><i/><i/><i/><span>M</span><small>VOICE LIVE</small></div>
  );
  return (
    <div className="room-visual room-visual--progress" aria-hidden>
      <div className="progress-bars">{[42, 66, 54, 82, 72, 91, 76].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
      <span>+12%</span><small>THIS MONTH</small>
    </div>
  );
}

export default function HomePage() {
  const { lang } = useI18n();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'in' | 'out'>('loading');
  const [loading, setLoading] = useState(false);
  const [demoKey, setDemoKey] = useState<DemoKey>('uk');
  const [demoPhase, setDemoPhase] = useState<DemoPhase>('result');
  const [canSpeak, setCanSpeak] = useState(false);
  const [showDock, setShowDock] = useState(false);
  const demo = DEMOS[demoKey];
  const isLoggedIn = sessionStatus === 'in';
  const authReady = sessionStatus !== 'loading';

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/users/me', { signal: controller.signal })
      .then((response) => setSessionStatus(response.ok ? 'in' : 'out'))
      .catch(() => setSessionStatus('out'));
    setCanSpeak('speechSynthesis' in window);

    const onScroll = () => setShowDock(window.scrollY > 430);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      controller.abort();
      window.removeEventListener('scroll', onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const guest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (!res.ok) throw new Error('Guest session failed');
      router.push('/dashboard');
      router.refresh();
    } catch {
      alert(lang === 'ru' ? 'Что-то пошло не так. Попробуйте ещё раз.' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemo = (key: DemoKey) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDemoKey(key);
    setDemoPhase('ready');
  };

  const runDemo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDemoPhase('analysing');
    timerRef.current = setTimeout(() => setDemoPhase('result'), 1100);
  };

  const hearWord = () => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(demo.word);
    utterance.lang = demo.voice;
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

  const methodSteps = [
    {
      key: 'speak' as const, number: '01', icon: 'voice' as IconName,
      title: lang === 'ru' ? 'Говори естественно' : 'Speak naturally',
      copy: lang === 'ru' ? 'Без тестового стресса. Просто скажи фразу так, как сказал бы её в жизни.' : 'No test anxiety. Say a phrase exactly as you would in real life.',
    },
    {
      key: 'understand' as const, number: '02', icon: 'sound' as IconName,
      title: lang === 'ru' ? 'Увидь детали' : 'See the details',
      copy: lang === 'ru' ? 'Мила разбирает ритм и звуки, а затем показывает одну понятную точку роста.' : 'Mila maps rhythm and sound, then gives you one clear improvement to make.',
    },
    {
      key: 'improve' as const, number: '03', icon: 'path' as IconName,
      title: lang === 'ru' ? 'Продолжай умнее' : 'Keep improving',
      copy: lang === 'ru' ? 'Следующая практика строится из твоей речи — короткая, личная и вовремя.' : 'Your next practice is built from your speech—short, personal, and timely.',
    },
  ];

  const rooms = [
    {
      id: 'pronunciation', icon: 'voice' as IconName, className: 'room-card--wide',
      label: lang === 'ru' ? 'Произношение' : 'Pronunciation',
      title: lang === 'ru' ? 'Тренируй точность речи' : 'Train the details of your voice',
      copy: lang === 'ru' ? 'Повторяй живые фразы и получай оценку каждого звука.' : 'Repeat natural phrases and get precise feedback on every sound.',
      href: '/listen',
    },
    {
      id: 'mentor', icon: 'spark' as IconName, className: 'room-card--tall',
      label: lang === 'ru' ? 'AI-наставница' : 'AI mentor',
      title: lang === 'ru' ? 'Разговаривай с Милой' : 'Talk it through with Mila',
      copy: lang === 'ru' ? 'Живой голосовой диалог в спокойном пространстве.' : 'A calm, private space for live voice conversation.',
      href: '/darshan',
    },
    {
      id: 'course', icon: 'book' as IconName, className: 'room-card--compact',
      label: lang === 'ru' ? 'Личный курс' : 'Personal course',
      title: lang === 'ru' ? 'Учись ради своей цели' : 'Learn for your real goals',
      copy: lang === 'ru' ? 'Уроки для работы, путешествий и общения.' : 'Lessons for work, travel, and conversation.',
      href: '/lessons',
    },
    {
      id: 'progress', icon: 'chart' as IconName, className: 'room-card--wide',
      label: lang === 'ru' ? 'Прогресс' : 'Progress',
      title: lang === 'ru' ? 'Видь, что становится сильнее' : 'See what is getting stronger',
      copy: lang === 'ru' ? 'Живая карта навыков выбирает следующую точку фокуса.' : 'A living skill map chooses your next area of focus.',
      href: '/progress',
    },
  ];

  return (
    <div className="landing-page">
      <a className="landing-skip" href="#mila-main">{lang === 'ru' ? 'К содержанию' : 'Skip to content'}</a>
      <header className="landing-nav">
        <nav className="landing-nav__inner" aria-label={lang === 'ru' ? 'Главная навигация' : 'Primary navigation'}>
          <button className="landing-brand" onClick={() => router.push('/')} aria-label="Mila home">
            <span className="landing-brand__mark">M</span>
            <span className="landing-brand__name">Mila</span>
            <span className="landing-brand__descriptor">{lang === 'ru' ? 'английский, который слышит' : 'English that listens back'}</span>
          </button>

          <div className="landing-nav__actions">
            <LangToggle />
            <button className="landing-signin" disabled={!authReady} aria-busy={!authReady} onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}>
              {!authReady ? '•••' : isLoggedIn ? (lang === 'ru' ? 'Кабинет' : 'Dashboard') : (lang === 'ru' ? 'Войти' : 'Sign in')}
            </button>
          </div>
        </nav>
      </header>

      <main id="mila-main">
      <section className="landing-hero">
        <div className="landing-hero__glow" aria-hidden />
        <div className="landing-shell landing-hero__grid">
          <div className="landing-hero__copy">
            <div className="landing-eyebrow"><span className="landing-eyebrow__dot" />{lang === 'ru' ? 'Персональный AI-наставник' : 'Private AI English coach'}</div>
            <h1>
              {lang === 'ru' ? <>Английский,<br/>который <em>слышит тебя.</em></> : <>English that<br/><em>listens back.</em></>}
            </h1>
            <p className="landing-hero__lede">
              {lang === 'ru'
                ? 'Говори как обычно. Мила услышит каждую фонему, объяснит один следующий шаг и соберёт практику вокруг твоего голоса.'
                : 'Speak naturally. Mila hears every phoneme, explains the next clear step, and builds practice around your voice.'}
            </p>

            <div className="landing-hero__actions">
              <button className="landing-button landing-button--primary" disabled={!authReady} onClick={() => router.push(isLoggedIn ? '/dashboard' : '/register')}>
                {!authReady ? (lang === 'ru' ? 'Готовим Mila…' : 'Preparing Mila…') : isLoggedIn ? (lang === 'ru' ? 'Продолжить обучение' : 'Continue learning') : (lang === 'ru' ? 'Начать бесплатно' : 'Start for free')}
                <Icon name="arrow" size={18} />
              </button>
              {sessionStatus === 'out' && (
                <button className="landing-button landing-button--secondary" onClick={guest} disabled={loading}>
                  {loading ? (lang === 'ru' ? 'Открываем…' : 'Opening…') : (lang === 'ru' ? 'Войти как гость' : 'Enter as a guest')}
                </button>
              )}
            </div>

            <div className="landing-assurance" aria-label={lang === 'ru' ? 'Условия старта' : 'Getting started'}>
              <span><Icon name="check" size={13}/>{lang === 'ru' ? 'Без карты' : 'No card'}</span>
              <span><Icon name="check" size={13}/>{lang === 'ru' ? 'Гостевой режим' : 'Guest mode'}</span>
              <span><Icon name="lock" size={13}/>{lang === 'ru' ? 'Личная практика' : 'Private practice'}</span>
            </div>
          </div>

          <div className="coach-demo" data-phase={demoPhase} aria-label={lang === 'ru' ? 'Интерактивный пример Mila' : 'Interactive Mila sample'}>
            <div className="coach-demo__accentbar">
              <div>
                <span className="coach-demo__kicker">{lang === 'ru' ? 'Интерактивный пример' : 'Interactive sample'}</span>
                <strong>{lang === 'ru' ? 'Как Мила слышит речь' : 'How Mila hears speech'}</strong>
              </div>
              <span className="coach-demo__sample">SAMPLE</span>
            </div>

            <div className="coach-demo__accents" aria-label={lang === 'ru' ? 'Выбрать акцент' : 'Choose an accent'}>
              {(Object.keys(DEMOS) as DemoKey[]).map((key) => (
                <button key={key} className={demoKey === key ? 'is-active' : ''} onClick={() => selectDemo(key)} aria-pressed={demoKey === key}>
                  <span>{DEMOS[key].code}</span>{DEMOS[key].place}
                </button>
              ))}
            </div>

            <div className="coach-demo__word">
              <div>
                <span key={demo.word}>{demo.word}</span>
                <small>{demo.ipa}</small>
              </div>
              {canSpeak && <button className="coach-demo__hear" onClick={hearWord} aria-label={`${lang === 'ru' ? 'Прослушать' : 'Hear'} ${demo.word}`}><Icon name="sound" size={19}/></button>}
            </div>

            <div className="coach-demo__wave" aria-hidden>
              {[18, 32, 22, 48, 68, 40, 82, 54, 34, 62, 92, 58, 40, 72, 44, 28, 50, 24].map((height, i) => (
                <i key={i} style={{ height, animationDelay: `${i * -0.07}s` }} />
              ))}
            </div>

            <div className="coach-demo__scan" aria-hidden><span /></div>

            <div className="coach-demo__result" aria-live="polite">
              {demoPhase === 'ready' ? (
                <div className="coach-demo__ready"><Icon name="spark" size={20}/><p>{lang === 'ru' ? 'Запусти пример, чтобы увидеть разбор.' : 'Run the sample to reveal Mila’s analysis.'}</p></div>
              ) : demoPhase === 'analysing' ? (
                <div className="coach-demo__analysing"><i/><p>{lang === 'ru' ? 'Разбираю ритм и фонемы…' : 'Mapping rhythm and phonemes…'}</p></div>
              ) : (
                <>
                  <div className="coach-demo__analysis">
                    <div className="coach-demo__score"><strong>{demo.score}</strong><span>{lang === 'ru' ? 'Ясность' : 'Clarity'}</span></div>
                    <div className="coach-demo__phonemes">
                      {demo.chunks.map((chunk, i) => <span key={chunk} className={i === demo.focus ? 'is-focus' : 'is-good'}>{chunk}</span>)}
                    </div>
                  </div>
                  <div className="coach-demo__note"><span className="coach-demo__avatar">M</span><p>{demo.note[lang]}</p></div>
                </>
              )}
            </div>

            <button className="coach-demo__run" onClick={runDemo} disabled={demoPhase === 'analysing'}>
              <Icon name={demoPhase === 'result' ? 'play' : 'spark'} size={17}/>
              {demoPhase === 'result'
                ? (lang === 'ru' ? 'Повторить разбор' : 'Replay analysis')
                : (lang === 'ru' ? 'Показать разбор Mila' : 'Show Mila’s analysis')}
            </button>
          </div>
        </div>
      </section>

      <section className="landing-trust" aria-label={lang === 'ru' ? 'Возможности Mila' : 'Mila capabilities'}>
        <div className="landing-shell landing-trust__inner">
          <div><span>01</span><p><strong>{lang === 'ru' ? 'Точность до фонемы' : 'Phoneme precision'}</strong>{lang === 'ru' ? 'Понимает отдельные звуки' : 'Understands individual sounds'}</p></div>
          <div><span>02</span><p><strong>{lang === 'ru' ? 'Живые акценты' : 'Real-world accents'}</strong>{lang === 'ru' ? 'Лондон · Нью-Йорк · Мумбаи' : 'London · New York · Mumbai'}</p></div>
          <div><span>03</span><p><strong>{lang === 'ru' ? 'Личный маршрут' : 'Personal path'}</strong>{lang === 'ru' ? 'Меняется вместе с тобой' : 'Adapts as you improve'}</p></div>
        </div>
      </section>

      <section className="landing-story" id="method">
        <div className="landing-shell session-story">
          <div className="session-story__intro">
            <span className="landing-section__label">{lang === 'ru' ? 'Одна сессия Mila' : 'One Mila session'}</span>
            <h2>{lang === 'ru' ? 'Говори. Пойми. Стань увереннее.' : 'Speak. Understand. Get better.'}</h2>
            <p>{lang === 'ru' ? 'Каждая практика превращает твою реальную речь в один достижимый следующий шаг.' : 'Every practice turns your real speech into one achievable next step.'}</p>
            <div className="session-story__line"><span /></div>
          </div>

          <div className="session-story__steps">
            {methodSteps.map((step) => (
              <article className="session-step" data-step={step.key} key={step.key}>
                <div className="session-step__copy">
                  <div><span>{step.number}</span><i><Icon name={step.icon} size={19}/></i></div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
                <StoryVisual kind={step.key} lang={lang} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--rooms">
        <div className="landing-shell">
          <div className="landing-section__heading landing-section__heading--left">
            <span>{lang === 'ru' ? 'Внутри Mila' : 'Inside Mila'}</span>
            <h2>{lang === 'ru' ? 'Один голос. Четыре способа расти.' : 'One voice. Four ways to grow.'}</h2>
            <p>{lang === 'ru' ? 'Выбери режим под сегодняшний день — Мила сохранит общий маршрут.' : 'Choose the mode that fits today. Mila keeps the whole path connected.'}</p>
          </div>

          <div className="room-grid">
            {rooms.map((room) => (
              <button className={`room-card ${room.className}`} data-room={room.id} key={room.href} onClick={() => router.push(isLoggedIn ? room.href : '/register')}>
                <span className="room-card__head">
                  <span className="room-card__icon"><Icon name={room.icon} /></span>
                  <span className="room-card__label">{room.label}</span>
                  <span className="room-card__link">{lang === 'ru' ? 'Открыть' : 'Explore'} <Icon name="arrow" size={16} /></span>
                </span>
                <span className="room-card__body">
                  <strong>{room.title}</strong>
                  <span className="room-card__copy">{room.copy}</span>
                </span>
                <RoomVisual id={room.id}/>
              </button>
            ))}
          </div>
          <div className="room-swipehint" aria-hidden><span/><span/><span/><small>{lang === 'ru' ? 'Листай режимы' : 'Swipe modes'}</small></div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta__orb" aria-hidden />
        <div className="landing-shell landing-cta__inner">
          <span className="landing-eyebrow"><span className="landing-eyebrow__dot" />{lang === 'ru' ? 'Первая сессия готова' : 'Your first session is ready'}</span>
          <h2>{lang === 'ru' ? 'Начни с голоса, который у тебя уже есть.' : 'Start with the voice you already have.'}</h2>
          <p>{lang === 'ru' ? 'Мила послушает, найдёт отправную точку и соберёт первую короткую практику.' : 'Mila will listen, find your starting point, and prepare your first short practice.'}</p>
          <button className="landing-button landing-button--primary" disabled={!authReady} onClick={() => router.push(isLoggedIn ? '/dashboard' : '/register')}>
            {!authReady ? (lang === 'ru' ? 'Готовим Mila…' : 'Preparing Mila…') : isLoggedIn ? (lang === 'ru' ? 'Вернуться в Mila' : 'Return to Mila') : (lang === 'ru' ? 'Начать бесплатно' : 'Start for free')} <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer__inner">
          <div className="landing-footer__brand"><span className="landing-brand__mark">M</span><span><strong>Mila</strong><small>{lang === 'ru' ? 'Персональный английский' : 'Personal English practice'}</small></span></div>
          <span>© {new Date().getFullYear()} Mila</span>
        </div>
      </footer>

      <div className={`mobile-quickstart ${showDock ? 'is-visible' : ''}`} aria-hidden={!showDock}>
        <div><span className="landing-brand__mark">M</span><p><strong>Mila</strong><small>{lang === 'ru' ? 'Твоя практика готова' : 'Your practice is ready'}</small></p></div>
        <button tabIndex={showDock ? 0 : -1} disabled={!authReady} onClick={() => router.push(isLoggedIn ? '/dashboard' : '/register')}>
          {!authReady ? '•••' : isLoggedIn ? (lang === 'ru' ? 'Открыть' : 'Open') : (lang === 'ru' ? 'Начать' : 'Start')} <Icon name="arrow" size={15}/>
        </button>
      </div>
    </div>
  );
}
