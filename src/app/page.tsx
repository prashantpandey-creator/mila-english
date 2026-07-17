'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import MilaIcon, { MilaIconName } from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import './landing.css';

type IconName = 'sound' | 'voice' | 'spark' | 'chart' | 'arrow' | 'play' | 'lock' | 'check' | 'home' | 'shield' | 'phone';
type DemoKey = 'uk' | 'us' | 'in';
type DemoPhase = 'ready' | 'analysing' | 'result';

const DEMOS = {
  uk: {
    code: 'LDN', place: 'London', voice: 'en-GB',
    word: 'comfortable', ipa: '/ˈkʌm.fə.tə.bəl/', score: 92,
    chunks: ['com', 'fort', 'a', 'ble'], focus: 1,
    note: {
      ru: 'Отличная ясность. Смягчи /f/ и сделай средний слог легче.',
      en: 'Great clarity. Soften the /f/ and keep the middle syllable light.',
    },
  },
  us: {
    code: 'NYC', place: 'New York', voice: 'en-US',
    word: 'thought', ipa: '/θɔːt/', score: 88,
    chunks: ['th', 'ough', 't'], focus: 0,
    note: {
      ru: 'Хороший ритм. Помести кончик языка между зубами для чистого /θ/.',
      en: 'Strong rhythm. Place the tip of your tongue between your teeth for a clean /θ/.',
    },
  },
  in: {
    code: 'BOM', place: 'Mumbai', voice: 'en-IN',
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
  if (name === 'voice') return <svg {...common}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.3 4.1L17 9l-3.7 1.9L12 15l-1.3-4.1L7 9l3.7-1.9z"/><path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z"/></svg>;
  if (name === 'chart') return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
  if (name === 'play') return <svg {...common} fill="currentColor" stroke="none"><path d="m9 7 8 5-8 5z"/></svg>;
  if (name === 'lock') return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
  if (name === 'home') return <svg {...common}><path d="m4 11 8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-6h4v6"/></svg>;
  if (name === 'shield') return <svg {...common}><path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6z"/><path d="m9 11.5 2 2 4-4.5"/></svg>;
  if (name === 'phone') return <svg {...common}><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>;
  return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
}

// Fade-up wrapper: reveals children when they enter the viewport. Must never
// be able to hide content permanently — old WebViews lack IntersectionObserver,
// so it fails open, and a timed safety reveals everything regardless.
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting || e.boundingClientRect.top < 0) e.target.classList.add('is-in');
      }),
      { threshold: 0.12 },
    );
    io.observe(node);
    const safety = setTimeout(() => node.classList.add('is-in'), 4000);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);
  return <div ref={ref} className={`lp-reveal ${className}`}>{children}</div>;
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
  const demo = DEMOS[demoKey];
  const isLoggedIn = sessionStatus === 'in';
  const authReady = sessionStatus !== 'loading';
  const T = (ru: string, en: string) => (lang === 'ru' ? ru : en);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/users/me', { signal: controller.signal })
      .then((response) => setSessionStatus(response.ok ? 'in' : 'out'))
      .catch(() => setSessionStatus('out'));
    setCanSpeak('speechSynthesis' in window);

    return () => {
      controller.abort();
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
      alert(T('Что-то пошло не так. Попробуйте ещё раз.', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const startCta = () => router.push(isLoggedIn ? '/dashboard' : '/register');
  const openDoor = (href: string) => router.push(isLoggedIn ? href : '/register');

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

  const proof = [
    { n: '01', title: T('Слышит каждый звук', 'Hears every sound'), copy: T('Разбор произношения до отдельной фонемы — не «хорошо/плохо», а что именно.', 'Pronunciation mapped to the single phoneme — not “good/bad”, but exactly what.') },
    { n: '02', title: T('Три живых акцента', 'Three living accents'), copy: T('Лондон · Нью-Йорк · Мумбаи. Слушай английский таким, какой он есть.', 'London · New York · Mumbai. Hear English the way it is actually spoken.') },
    { n: '03', title: T('Свои серверы', 'Its own servers'), copy: T('Голос обрабатывается у Mila и удаляется после проверки. Поэтому — без VPN.', 'Your voice is processed on Mila’s servers and deleted after scoring. Hence — no VPN.') },
    { n: '04', title: T('Помнит твой путь', 'Remembers your path'), copy: T('Слова и звуки возвращаются ровно тогда, когда ты готов их забыть.', 'Words and sounds return exactly when you are about to forget them.') },
  ];

  const steps = [
    {
      key: 'speak', number: '01', icon: 'voice' as IconName,
      title: T('Говори естественно', 'Speak naturally'),
      copy: T('Без тестового стресса. Просто скажи фразу так, как сказал бы её в жизни.', 'No test anxiety. Say a phrase exactly as you would in real life.'),
    },
    {
      key: 'understand', number: '02', icon: 'sound' as IconName,
      title: T('Увидь детали', 'See the details'),
      copy: T('Мила разбирает ритм и звуки, а затем показывает одну понятную точку роста.', 'Mila maps rhythm and sound, then shows one clear point of growth.'),
    },
    {
      key: 'improve', number: '03', icon: 'chart' as IconName,
      title: T('Продолжай умнее', 'Keep improving'),
      copy: T('Следующая практика строится из твоей речи — короткая, личная и вовремя.', 'Your next practice is built from your speech — short, personal, on time.'),
    },
  ];

  const doors: { icon: MilaIconName; kicker: string; title: string; copy: string; href: string; cls: string; start?: boolean; accent: [string, string, string] }[] = [
    {
      accent: ['#b3502c', 'rgba(179, 80, 44, 0.09)', 'rgba(179, 80, 44, 0.35)'], icon: 'level', cls: 'lp-door--lead', href: '/assessment', start: true,
      kicker: T('Проверка уровня', 'Level check'),
      title: T('Пять минут голосом — и Mila знает, с чего начать', 'Five minutes of your voice — Mila knows where to begin'),
      copy: T('Прочитай фразу, ответь на четыре вопроса. Мила определит уровень и соберёт личный план. Есть режим без микрофона.', 'Read one phrase, answer four questions. Mila places your level and builds a personal plan. A no-microphone mode is included.'),
    },
    {
      accent: ['#a83d64', 'rgba(168, 61, 100, 0.08)', 'rgba(168, 61, 100, 0.32)'], icon: 'tutor', cls: 'lp-door--main', href: '/darshan',
      kicker: T('Мила-наставница', 'Mila tutor'),
      title: T('Разговаривай с Милой вслух', 'Talk it through with Mila'),
      copy: T('Живой голосовой диалог в спокойном пространстве. Никакого судейства — только внимание.', 'Live voice conversation in a calm, private space. No judgement — only attention.'),
    },
    {
      accent: ['#0c7895', 'rgba(12, 120, 149, 0.07)', 'rgba(12, 120, 149, 0.3)'], icon: 'listening', cls: 'lp-door--third', href: '/listen',
      kicker: T('Слушание', 'Listening'),
      title: T('Произношение по звукам', 'Pronunciation, sound by sound'),
      copy: T('Живые фразы, три акцента, разбор каждой фонемы.', 'Real phrases, three accents, every phoneme mapped.'),
    },
    {
      accent: ['#a9720f', 'rgba(169, 114, 15, 0.09)', 'rgba(169, 114, 15, 0.34)'], icon: 'vocabulary', cls: 'lp-door--third', href: '/vocabulary',
      kicker: T('Новые слова', 'New words'),
      title: T('Словарь, который не забывается', 'Vocabulary that stays'),
      copy: T('Интервальные повторения возвращают слово точно в срок.', 'Spaced repetition brings each word back right on time.'),
    },
    {
      accent: ['#5f7052', 'rgba(95, 112, 82, 0.09)', 'rgba(95, 112, 82, 0.32)'], icon: 'grammar', cls: 'lp-door--third', href: '/grammar',
      kicker: T('Грамматика', 'Grammar'),
      title: T('Правила через твои фразы', 'Rules through your own phrases'),
      copy: T('Грамматика объясняется на языке, которым ты уже говоришь.', 'Grammar explained through language you already use.'),
    },
  ];

  const cities = [
    { src: '/ambience/stills/uk-bigben-night.jpg', code: 'LDN', name: T('Лондон', 'London'), note: T('Британский английский', 'British English') },
    { src: '/ambience/stills/us-manhattan.jpg', code: 'NYC', name: T('Нью-Йорк', 'New York'), note: T('Американский английский', 'American English') },
    { src: '/ambience/stills/in-taj-aerial.jpg', code: 'AGR', name: T('Агра', 'Agra'), note: T('Индийский английский', 'Indian English') },
  ];

  const homeRows = [
    {
      icon: 'home' as IconName,
      title: T('Работает в России', 'Works in Russia'),
      copy: T('Распознавание речи, оценка произношения и наставница живут на собственных серверах Mila — не у сторонних AI-провайдеров. Поэтому VPN не нужен.', 'Speech recognition, pronunciation scoring, and the mentor live on Mila’s own servers — not with third-party AI providers. That is why no VPN is needed.'),
    },
    {
      icon: 'shield' as IconName,
      title: T('Приватно по построению', 'Private by construction'),
      copy: T('Запись обрабатывается на серверах Mila для оценки и удаляется после запроса. Твой голос не передаётся большим AI-компаниям.', 'Recordings are processed on Mila’s servers for scoring and deleted after the request. Your voice is not handed to big AI companies.'),
    },
    {
      icon: 'phone' as IconName,
      title: T('Приложение из браузера', 'An app straight from the browser'),
      copy: T('Mila устанавливается на Android и iPhone за минуту — без App Store и обновлений вручную.', 'Mila installs on Android and iPhone in a minute — no App Store, no manual updates.'),
    },
  ];

  const faq = [
    {
      q: T('Это бесплатно?', 'Is it free?'),
      a: T('Да. Начать можно бесплатно и без карты: гостевой режим открывает уроки, тренировку произношения и проверку уровня.', 'Yes. You can start free with no card: guest mode opens lessons, pronunciation practice, and the level check.'),
    },
    {
      q: T('Работает ли Mila в России без VPN?', 'Does Mila work in Russia without a VPN?'),
      a: T('Да, это главный принцип её устройства: основные голосовые функции — распознавание речи, оценка произношения, наставница — работают на собственных серверах Mila, а не через зарубежных AI-провайдеров.', 'Yes — it is the core of her design: the main voice features (speech recognition, pronunciation scoring, the mentor) run on Mila’s own servers, not through foreign AI providers.'),
    },
    {
      q: T('У меня слабое произношение. Это будет стыдно?', 'My pronunciation is weak. Will this be embarrassing?'),
      a: T('Нет. Мила не выносит приговоров и не считает акцент ошибкой. Она отмечает, что уже звучит ясно, и предлагает один достижимый следующий шаг — наедине с тобой.', 'No. Mila passes no verdicts and never treats an accent as a mistake. She notes what already sounds clear and offers one achievable next step — in private.'),
    },
    {
      q: T('Что происходит с моими записями?', 'What happens to my recordings?'),
      a: T('Они обрабатываются на серверах Mila только для оценки и удаляются после запроса. Необязательный режим живого AI-интервью использует внешнего провайдера и доступен только в поддерживаемых регионах — по твоему выбору.', 'They are processed on Mila’s servers only for scoring and deleted after the request. The optional live AI-interview mode uses an external provider and is available only in supported regions — your choice.'),
    },
    {
      q: T('Можно ли поставить Mila на телефон?', 'Can I install Mila on my phone?'),
      a: T('Да. Открой mila.purangpt.com в браузере телефона — Mila предложит установить себя как приложение на Android и iPhone.', 'Yes. Open mila.purangpt.com in your phone’s browser — Mila will offer to install herself as an app on Android and iPhone.'),
    },
  ];

  return (
    <div className="lp">
      <a className="lp-skip" href="#lp-main">{T('К содержанию', 'Skip to content')}</a>

      <header className="lp-nav">
        <nav className="lp-shell lp-nav__inner" aria-label={T('Главная навигация', 'Primary navigation')}>
          <button className="lp-brand" onClick={() => router.push('/')} aria-label="Mila home">
            <span className="lp-brand__mark">M</span>
            <span className="lp-brand__name">Mila</span>
            <span className="lp-brand__tag">{T('английский, который слышит', 'English that listens back')}</span>
          </button>
          <div className="lp-nav__actions">
            <LangToggle />
            <button className="lp-signin" disabled={!authReady} aria-busy={!authReady} onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}>
              {!authReady ? '•••' : isLoggedIn ? T('Кабинет', 'Dashboard') : T('Войти', 'Sign in')}
            </button>
          </div>
        </nav>
      </header>

      <main id="lp-main">
        {/* ── Hero ── */}
        <section className="lp-hero">
          <div className="lp-shell lp-hero__grid">
            <div className="lp-hero__copy">
              <div className="lp-eyebrow"><i />{T('Персональная AI-наставница · Работает в России', 'Private AI English coach · Works in Russia')}</div>
              <h1>{lang === 'ru' ? <>Английский, который <em>слышит тебя.</em></> : <>English that <em>listens back.</em></>}</h1>
              <p className="lp-hero__lede">
                {T(
                  'Говори как обычно. Мила разбирает твою речь до отдельного звука, объясняет один понятный следующий шаг и строит практику вокруг твоего голоса — на своих серверах, без VPN.',
                  'Speak naturally. Mila maps your speech down to the single sound, explains one clear next step, and builds practice around your voice — on her own servers, no VPN.',
                )}
              </p>
              <div className="lp-hero__actions">
                <button className="lp-btn lp-btn--primary" disabled={!authReady} onClick={startCta}>
                  {!authReady ? T('Готовим Mila…', 'Preparing Mila…') : isLoggedIn ? T('Продолжить обучение', 'Continue learning') : T('Начать бесплатно', 'Start for free')}
                  <Icon name="arrow" size={18} />
                </button>
                {sessionStatus === 'out' && (
                  <button className="lp-btn lp-btn--ghost" onClick={guest} disabled={loading}>
                    {loading ? T('Открываем…', 'Opening…') : T('Войти как гость', 'Enter as a guest')}
                  </button>
                )}
              </div>
              <div className="lp-assure" aria-label={T('Условия старта', 'Getting started')}>
                <span><Icon name="check" size={13} />{T('Без карты', 'No card')}</span>
                <span><Icon name="check" size={13} />{T('Без VPN', 'No VPN')}</span>
                <span><Icon name="lock" size={13} />{T('Голос остаётся у Mila', 'Your voice stays with Mila')}</span>
              </div>
            </div>

            {/* ── Interactive sample ── */}
            <div className="lp-demo" data-phase={demoPhase} aria-label={T('Интерактивный пример Mila', 'Interactive Mila sample')}>
              <div className="lp-demo__head">
                <div>
                  <strong>{T('Как Мила слышит речь', 'How Mila hears speech')}</strong>
                  <small>{T('Интерактивный пример', 'Interactive sample')}</small>
                </div>
                <span className="lp-demo__badge">SAMPLE</span>
              </div>

              <div className="lp-demo__accents" aria-label={T('Выбрать акцент', 'Choose an accent')}>
                {(Object.keys(DEMOS) as DemoKey[]).map((key) => (
                  <button key={key} className={demoKey === key ? 'is-active' : ''} onClick={() => selectDemo(key)} aria-pressed={demoKey === key}>
                    <span>{DEMOS[key].code}</span>{DEMOS[key].place}
                  </button>
                ))}
              </div>

              <div className="lp-demo__word">
                <div>
                  <span key={demo.word}>{demo.word}</span>
                  <small>{demo.ipa}</small>
                </div>
                {canSpeak && (
                  <button className="lp-demo__hear" onClick={hearWord} aria-label={`${T('Прослушать', 'Hear')} ${demo.word}`}>
                    <Icon name="sound" size={19} />
                  </button>
                )}
              </div>

              <div className="lp-demo__wave" aria-hidden>
                {[18, 32, 22, 48, 68, 40, 82, 54, 34, 62, 92, 58, 40, 72, 44, 28, 50, 24].map((height, i) => (
                  <i key={i} style={{ height: `${(height / 92) * 100}%`, animationDelay: `${i * -0.07}s` }} />
                ))}
              </div>

              <div className="lp-demo__result" aria-live="polite">
                {demoPhase === 'ready' ? (
                  <div className="lp-demo__waiting"><Icon name="spark" size={20} /><p>{T('Запусти пример, чтобы увидеть разбор.', 'Run the sample to reveal Mila’s analysis.')}</p></div>
                ) : demoPhase === 'analysing' ? (
                  <div className="lp-demo__waiting"><i /><p>{T('Разбираю ритм и фонемы…', 'Mapping rhythm and phonemes…')}</p></div>
                ) : (
                  <>
                    <div className="lp-demo__analysis">
                      <div className="lp-demo__score"><strong>{demo.score}</strong><span>{T('Ясность', 'Clarity')}</span></div>
                      <div className="lp-demo__phonemes">
                        {demo.chunks.map((chunk, i) => <span key={chunk} className={i === demo.focus ? 'is-focus' : 'is-good'}>{chunk}</span>)}
                      </div>
                    </div>
                    <div className="lp-demo__note"><span className="lp-demo__avatar">M</span><p>{demo.note[lang]}</p></div>
                  </>
                )}
              </div>

              <button className="lp-demo__run" onClick={runDemo} disabled={demoPhase === 'analysing'}>
                <Icon name={demoPhase === 'result' ? 'play' : 'spark'} size={17} />
                {demoPhase === 'result' ? T('Повторить разбор', 'Replay analysis') : T('Показать разбор Mila', 'Show Mila’s analysis')}
              </button>
            </div>
          </div>
        </section>

        {/* ── Proof strip ── */}
        <section className="lp-proof" aria-label={T('Почему Mila', 'Why Mila')}>
          <div className="lp-shell lp-proof__inner">
            {proof.map((item) => (
              <div className="lp-proof__item" key={item.n}>
                <span>{item.n}</span>
                <div><strong>{item.title}</strong><p>{item.copy}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Method ── */}
        <section className="lp-section" id="method">
          <div className="lp-shell">
            <Reveal className="lp-section__head">
              <span className="lp-label">{T('Одна сессия Mila', 'One Mila session')}</span>
              <h2>{lang === 'ru' ? <>Говори. Пойми. <em>Стань увереннее.</em></> : <>Speak. Understand. <em>Get better.</em></>}</h2>
              <p>{T('Каждая практика превращает твою реальную речь в один достижимый следующий шаг.', 'Every practice turns your real speech into one achievable next step.')}</p>
            </Reveal>
            <div className="lp-method">
              {steps.map((step) => (
                <Reveal key={step.key}>
                  <article className="lp-step">
                    <div className="lp-step__top"><span>{step.number}</span><i><Icon name={step.icon} size={19} /></i></div>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                    {step.key === 'speak' && (
                      <div className="lp-step__ui" aria-hidden>
                        <div className="lp-step__status"><i />{T('Голос распознан', 'Voice captured')}</div>
                        <div className="lp-step__wave">{[38, 62, 41, 88, 56, 100, 70, 47, 91, 60, 78, 45].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
                        <p>“I’d like to feel more confident in meetings.”</p>
                      </div>
                    )}
                    {step.key === 'understand' && (
                      <div className="lp-step__ui" aria-hidden>
                        <div className="lp-step__label">{T('Карта произношения', 'Pronunciation map')}</div>
                        <div className="lp-step__phrase"><span>I’d</span><span className="is-clear">like</span><span>to</span><span className="is-focus">feel</span><span>more</span><span className="is-clear">confident</span></div>
                        <div className="lp-step__insight"><span>/f/</span><p>{T('Сделай атаку мягче и короче', 'Use a softer, shorter onset')}</p></div>
                      </div>
                    )}
                    {step.key === 'improve' && (
                      <div className="lp-step__ui" aria-hidden>
                        <div className="lp-step__label">{T('Следующая практика', 'Your next practice')}</div>
                        <div className="lp-step__row"><span><Icon name="voice" size={15} />{T('Произношение', 'Pronunciation')}</span><strong>7 {T('мин', 'min')}</strong></div>
                        <div className="lp-step__row"><span><Icon name="spark" size={15} />{T('Разговор', 'Conversation')}</span><strong>3 {T('мин', 'min')}</strong></div>
                        <div className="lp-step__row is-done"><span><Icon name="check" size={15} />{T('Повторить завтра', 'Review tomorrow')}</span><strong>09:00</strong></div>
                      </div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Five doors ── */}
        <section className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-shell">
            <Reveal className="lp-section__head">
              <span className="lp-label">{T('Внутри Mila', 'Inside Mila')}</span>
              <h2>{lang === 'ru' ? <>Один голос. <em>Пять дверей.</em></> : <>One voice. <em>Five doors.</em></>}</h2>
              <p>{T('Проверка уровня, слушание, слова, наставница и грамматика — каждая дверь ведёт в общий маршрут.', 'Level check, listening, words, the mentor, and grammar — every door leads into one connected path.')}</p>
            </Reveal>
            <div className="lp-doors">
              {doors.map((door) => (
                <button
                  key={door.href}
                  className={`lp-door ${door.cls}`}
                  style={{ '--door-accent': door.accent[0], '--door-soft': door.accent[1], '--door-line': door.accent[2] } as React.CSSProperties}
                  onClick={() => openDoor(door.href)}
                >
                  {door.start && <span className="lp-door__start">{T('Начни здесь', 'Start here')}</span>}
                  <span className="lp-door__icon"><MilaIcon name={door.icon} size={26} /></span>
                  <span className="lp-door__kicker">{door.kicker}</span>
                  <strong>{door.title}</strong>
                  <p>{door.copy}</p>
                  <span className="lp-door__go">{T('Открыть', 'Open')} <Icon name="arrow" size={15} /></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cities ── */}
        <section className="lp-section" style={{ paddingTop: 0 }} aria-label={T('Акценты Mila', 'Mila accents')}>
          <div className="lp-shell">
            <Reveal className="lp-section__head lp-section__head--center">
              <span className="lp-label">{T('Три акцента', 'Three accents')}</span>
              <h2>{lang === 'ru' ? <>Учись для мест, <em>куда собираешься.</em></> : <>Learn for the places <em>you are going.</em></>}</h2>
            </Reveal>
            <div className="lp-cities">
              {cities.map((city) => (
                <Reveal key={city.code}>
                  <figure className="lp-city" style={{ margin: 0 }}>
                    <img src={city.src} alt={city.name} loading="lazy" />
                    <figcaption>
                      <span>{city.code}</span>
                      <strong>{city.name}</strong>
                      <small>{city.note}</small>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Privacy / Russia ── */}
        <section className="lp-home">
          <div className="lp-shell lp-section">
            <div className="lp-home__grid">
              <Reveal className="lp-section__head">
                <span className="lp-label">{T('Устройство Mila', 'How Mila is built')}</span>
                <h2>{lang === 'ru' ? <>Голос, который <em>остаётся дома.</em></> : <>A voice that <em>stays home.</em></>}</h2>
                <p>{T('Большинство AI-приложений отправляют твой голос за океан. Mila устроена иначе — и это меняет всё: доступность, приватность, спокойствие.', 'Most AI apps ship your voice across the ocean. Mila is built differently — and that changes everything: availability, privacy, peace of mind.')}</p>
              </Reveal>
              <Reveal>
                <div className="lp-home__rows">
                  {homeRows.map((row) => (
                    <div className="lp-home__row" key={row.title}>
                      <i><Icon name={row.icon} size={20} /></i>
                      <div><strong>{row.title}</strong><p>{row.copy}</p></div>
                    </div>
                  ))}
                </div>
                <p className="lp-home__note">
                  {T(
                    'Необязательный режим живого AI-интервью использует внешнего провайдера и доступен только в поддерживаемых регионах.',
                    'The optional live AI-interview mode uses an external provider and is available only in supported regions.',
                  )}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-section" id="faq">
          <div className="lp-shell">
            <Reveal className="lp-section__head lp-section__head--center">
              <span className="lp-label">FAQ</span>
              <h2>{T('Честные ответы', 'Honest answers')}</h2>
            </Reveal>
            <Reveal>
              <div className="lp-faq">
                {faq.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}<i>+</i></summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="lp-cta">
          <div className="lp-cta__orb" aria-hidden />
          <div className="lp-shell lp-cta__inner">
            <span className="lp-eyebrow"><i />{T('Первая сессия готова', 'Your first session is ready')}</span>
            <h2>{lang === 'ru' ? <>Начни с голоса, который <em>у тебя уже есть.</em></> : <>Start with the voice <em>you already have.</em></>}</h2>
            <p>{T('Мила послушает, найдёт отправную точку и соберёт первую короткую практику. Пять минут — без карты и без VPN.', 'Mila will listen, find your starting point, and prepare your first short practice. Five minutes — no card, no VPN.')}</p>
            <div className="lp-cta__actions">
              <button className="lp-btn lp-btn--primary" disabled={!authReady} onClick={startCta}>
                {!authReady ? T('Готовим Mila…', 'Preparing Mila…') : isLoggedIn ? T('Вернуться в Mila', 'Return to Mila') : T('Начать бесплатно', 'Start for free')}
                <Icon name="arrow" size={18} />
              </button>
              {sessionStatus === 'out' && (
                <button className="lp-btn lp-btn--ghost" onClick={guest} disabled={loading}>
                  {loading ? T('Открываем…', 'Opening…') : T('Войти как гость', 'Enter as a guest')}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-shell lp-footer__inner">
          <div className="lp-footer__brand">
            <span className="lp-brand__mark">M</span>
            <span><strong>Mila</strong><small>{T('Персональный английский', 'Personal English practice')}</small></span>
          </div>
          <span>© {new Date().getFullYear()} Mila</span>
        </div>
      </footer>

    </div>
  );
}
