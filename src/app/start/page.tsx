'use client';

// ── Mila conversion landing (/start) ────────────────────────────────────────
// A focused, self-contained funnel for PAID traffic — deliberately separate
// from the flagship cinematic landing at "/". Same brand (Yeseva One + Caveat,
// terracotta), direct-response structure. No testimonials yet (a real, consented
// set can be added later). Prices are owner-approved estimates (2026-07-18),
// anchored to the "3 cups of coffee a month" framing / RU market — change the
// `price` field on each plan to update them.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import './start.css';

type Ico =
  | 'arrow' | 'check' | 'shield' | 'card' | 'clock' | 'mute'
  | 'spark' | 'ear' | 'target' | 'heart' | 'play' | 'lock';

function Icon({ name, size = 22 }: { name: Ico; size?: number }) {
  const c = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
  };
  switch (name) {
    case 'arrow': return <svg {...c}><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
    case 'check': return <svg {...c}><path d="m5 12 4 4L19 6" /></svg>;
    case 'shield': return <svg {...c}><path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6z" /><path d="M12 9v3" /><path d="M12 15h.01" /></svg>;
    case 'card': return <svg {...c}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><path d="M15 14h2" /></svg>;
    case 'clock': return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3.5 2" /></svg>;
    case 'mute': return <svg {...c}><path d="M4 14h3l4 4V6L7 10H4z" /><path d="m15 9.5 4.5 4.5M19.5 9.5 15 14" /></svg>;
    case 'spark': return <svg {...c}><path d="m12 3 1.3 4.1L17 9l-3.7 1.9L12 15l-1.3-4.1L7 9l3.7-1.9z" /></svg>;
    case 'ear': return <svg {...c}><path d="M7 9a5 5 0 1 1 9 3c-1.3 1.4-2.2 1.9-2.6 3A2.6 2.6 0 0 1 8.5 16" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0" /></svg>;
    case 'target': return <svg {...c}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.3" /></svg>;
    case 'heart': return <svg {...c}><path d="M12 20s-7-4.6-7-10a3.9 3.9 0 0 1 7-2.4A3.9 3.9 0 0 1 19 10c0 5.4-7 10-7 10z" /></svg>;
    case 'play': return <svg {...c} fill="currentColor" stroke="none"><path d="m9 7 8 5-8 5z" /></svg>;
    case 'lock': return <svg {...c}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    default: return <svg {...c} />;
  }
}

export default function StartPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const T = (ru: string, en: string) => (lang === 'ru' ? ru : en);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'in' | 'out'>('loading');
  const isLoggedIn = sessionStatus === 'in';
  const authReady = sessionStatus !== 'loading';

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/users/me', { signal: controller.signal })
      .then((r) => setSessionStatus(r.ok ? 'in' : 'out'))
      .catch(() => setSessionStatus('out'));
    return () => controller.abort();
  }, []);

  const start = () => router.push(isLoggedIn ? '/dashboard' : '/register');

  const problems: { icon: Ico; title: string; copy: string }[] = [
    { icon: 'shield', title: T('Языковой барьер', 'The language barrier'), copy: T('Вы боитесь сделать ошибку и выглядеть глупо перед живым преподавателем.', 'You are afraid to make a mistake and look foolish in front of a real teacher.') },
    { icon: 'card', title: T('Дороговизна', 'High cost'), copy: T('Хороший репетитор стоит дорого, а заниматься нужно каждый день.', 'A good tutor is expensive — and you need to practice every day.') },
    { icon: 'clock', title: T('Жёсткий график', 'Rigid schedule'), copy: T('Тяжело подстраивать жизнь под расписание уроков.', 'It is hard to fit your life around a fixed lesson timetable.') },
    { icon: 'mute', title: T('«Всё понимаю, но молчу»', 'The “I understand but I freeze” effect'), copy: T('Вы знаете правила, но в реальном диалоге слова вылетают из головы.', 'You know the rules, but in a real conversation the words escape you.') },
  ];

  const benefits: { icon: Ico; title: string; copy: string }[] = [
    { icon: 'heart', title: T('Полный психологический комфорт', 'Total psychological comfort'), copy: T('Робот не осудит за плохой акцент или забытое слово. Ошибайтесь сколько угодно.', 'The AI never judges a rough accent or a forgotten word. Make as many mistakes as you need.') },
    { icon: 'spark', title: T('Моментальный разбор ошибок', 'Instant feedback on mistakes'), copy: T('ИИ не прерывает вас, а сразу после реплики мягко подсказывает, как сказать естественнее.', 'The AI never interrupts you — the moment you finish, it gently shows you how to say it more naturally.') },
    { icon: 'target', title: T('Подстройка под ваши интересы', 'Built around your interests'), copy: T('Обсуждайте то, что любите: от блокбастеров Marvel и кулинарии до подготовки к собеседованию.', 'Talk about what you love — from Marvel blockbusters and cooking to interview prep.') },
    { icon: 'ear', title: T('Интерактивное распознавание речи', 'Interactive speech recognition'), copy: T('Система оценивает произношение и помогает звучать как native speaker.', 'It scores your pronunciation and helps you sound like a native speaker.') },
  ];

  const steps: { n: string; title: string; copy: string }[] = [
    { n: '01', title: T('Выберите сценарий', 'Choose a scenario'), copy: T('Реальная ситуация: «В аэропорту», «Презентация продукта», «Разговор в баре» — или свободный диалог.', 'A real-life situation — “At the airport”, “Product presentation”, “Conversation at a bar” — or just free talk.') },
    { n: '02', title: T('Говорите вслух', 'Speak out loud'), copy: T('Нажмите кнопку и общайтесь с ИИ, как по телефону. Он подстраивает сложность речи под ваш уровень.', 'Tap the button and talk to the AI like a phone call. It adjusts its language to your level.') },
    { n: '03', title: T('Получите отчёт', 'Get your report'), copy: T('После каждой сессии — прогресс, новые слова и топ-3 правил, которые стоит подтянуть.', 'After every session — your progress, new words, and a personal top-3 of grammar points to work on.') },
  ];

  // Prices are owner-approved estimates (see file header). `price` is the number;
  // the currency + period label is localised below.
  const plans: { name: string; featured: boolean; price: string; badge?: string; features: string[] }[] = [
    {
      name: 'START', featured: false, price: '590',
      features: [
        T('15 минут разговоров с ИИ в день', '15 minutes of AI conversation a day'),
        T('Доступ к 20 базовым сценариям', 'Access to 20 starter scenarios'),
        T('Базовая статистика ошибок', 'Basic error tracking'),
      ],
    },
    {
      name: 'UNLIMITED', featured: true, price: '1490', badge: T('Хит продаж', 'Bestseller'),
      features: [
        T('Безлимитные разговоры 24/7', 'Unlimited conversation, 24/7'),
        T('Все сценарии + генерация своих тем', 'Every scenario, plus your own generated topics'),
        T('Глубокий ИИ-анализ произношения и грамматики', 'In-depth AI analysis of pronunciation and grammar'),
        T('Доступ в закрытый клуб студентов', 'Access to a private student community'),
      ],
    },
  ];

  const ctaLabel = !authReady
    ? T('Готовим Mila…', 'Preparing Mila…')
    : isLoggedIn ? T('Продолжить обучение', 'Continue learning') : T('Начать бесплатно', 'Start free training');

  return (
    <div className="ad">
      <a className="ad-skip" href="#ad-main">{T('К содержанию', 'Skip to content')}</a>

      <header className="ad-nav">
        <div className="ad-shell ad-nav__inner">
          <button className="ad-brand" onClick={() => router.push('/')} aria-label="Mila">
            <span className="ad-brand__mark">M</span>
            <span className="ad-brand__name">Mila</span>
          </button>
          <div className="ad-nav__actions">
            <LangToggle />
            <button className="ad-signin" disabled={!authReady} onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}>
              {!authReady ? '•••' : isLoggedIn ? T('Кабинет', 'Dashboard') : T('Войти', 'Sign in')}
            </button>
          </div>
        </div>
      </header>

      <main id="ad-main">
        {/* ── Hero ── */}
        <section className="ad-hero">
          <div className="ad-hero__glow" aria-hidden />
          <div className="ad-shell ad-hero__inner">
            <div className="ad-eyebrow"><i />{T('Персональный AI-тренажёр · Работает в России', 'Personal AI trainer · Works in Russia')}</div>
            <h1>{lang === 'ru'
              ? <>Заговорите по-английски <em>без страха и барьера.</em></>
              : <>Speak English <em>without fear or a barrier.</em></>}</h1>
            <p className="ad-hero__lede">{T(
              'Персональный ИИ-тренажёр: доступен 24/7, подстраивается под ваш темп и выводит в свободную речь за 2 месяца. Без репетиторов и стыда за ошибки.',
              'A personal AI trainer — available 24/7, adapts to your pace, and gets you speaking fluently in 2 months. No tutors, no shame in mistakes.',
            )}</p>
            <div className="ad-hero__actions">
              <button className="ad-btn ad-btn--primary" disabled={!authReady} onClick={start}>
                {ctaLabel}<Icon name="arrow" size={18} />
              </button>
              <span className="ad-hero__cap">{T('5 минут, чтобы попробовать — бесплатно', '5 minutes to try it — free')}</span>
            </div>
            <div className="ad-chips" aria-label={T('Условия старта', 'Getting started')}>
              <span><Icon name="check" size={13} />{T('Без карты', 'No card')}</span>
              <span><Icon name="check" size={13} />{T('Без VPN', 'No VPN')}</span>
              <span><Icon name="lock" size={13} />{T('Голос остаётся у Mila', 'Your voice stays with Mila')}</span>
            </div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section className="ad-section">
          <div className="ad-shell">
            <div className="ad-head">
              <span className="ad-label">{T('Почему классические методы не работают', 'Why traditional methods fall short')}</span>
              <h2>{T('Почему вы до сих пор не говорите свободно?', 'Why aren’t you speaking fluently yet?')}</h2>
            </div>
            <div className="ad-grid ad-grid--4">
              {problems.map((p) => (
                <article className="ad-card" key={p.title}>
                  <span className="ad-card__icon ad-card__icon--warn"><Icon name={p.icon} size={22} /></span>
                  <strong>{p.title}</strong>
                  <p>{p.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="ad-section ad-section--band">
          <div className="ad-shell">
            <div className="ad-head ad-head--center">
              <span className="ad-label">{T('Сила нашего ИИ', 'The power of our AI')}</span>
              <h2>{T('Идеальный собеседник — всегда под рукой', 'Your perfect conversation partner — always within reach')}</h2>
              <p>{T('Не просто чат-бот, а полноценный ментор, созданный лингвистами и методистами.', 'Not just a chatbot — a full-fledged mentor, built by linguists and learning designers.')}</p>
            </div>
            <div className="ad-grid ad-grid--4">
              {benefits.map((b) => (
                <article className="ad-card ad-card--soft" key={b.title}>
                  <span className="ad-card__icon"><Icon name={b.icon} size={22} /></span>
                  <strong>{b.title}</strong>
                  <p>{b.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="ad-section">
          <div className="ad-shell">
            <div className="ad-head ad-head--center">
              <span className="ad-label">{T('Как это работает', 'How it works')}</span>
              <h2>{T('Три шага к уверенной речи', '3 steps to speaking with confidence')}</h2>
            </div>
            <div className="ad-steps">
              {steps.map((s) => (
                <article className="ad-step" key={s.n}>
                  <span className="ad-step__n">{s.n}</span>
                  <strong>{s.title}</strong>
                  <p>{s.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="ad-section ad-section--band" id="pricing">
          <div className="ad-shell">
            <div className="ad-head ad-head--center">
              <span className="ad-label">{T('Тарифы', 'Pricing')}</span>
              <h2>{T('Инвестируйте в свой английский', 'Invest in your English')}</h2>
              <p>{T('По цене трёх чашек кофе в месяц.', 'For the price of three cups of coffee a month.')}</p>
            </div>
            <div className="ad-plans">
              {plans.map((plan) => (
                <article className={`ad-plan${plan.featured ? ' ad-plan--featured' : ''}`} key={plan.name}>
                  {plan.badge && <span className="ad-plan__badge">{plan.badge}</span>}
                  <span className="ad-plan__name">{plan.name}</span>
                  <div className="ad-plan__price">
                    <span className="ad-plan__amount">{plan.price}</span>
                    <small>{T('₽ / мес', '₽ / mo')}</small>
                  </div>
                  <ul className="ad-plan__features">
                    {plan.features.map((f) => (
                      <li key={f}><Icon name="check" size={15} />{f}</li>
                    ))}
                  </ul>
                  <button className={`ad-btn ${plan.featured ? 'ad-btn--primary' : 'ad-btn--ghost'} ad-plan__cta`} disabled={!authReady} onClick={start}>
                    {plan.featured ? T('Начать безлимит', 'Start unlimited') : T('Выбрать тариф', 'Choose this plan')}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="ad-cta">
          <div className="ad-cta__orb" aria-hidden />
          <div className="ad-shell ad-cta__inner">
            <h2>{lang === 'ru'
              ? <>Перестаньте учить английский. <em>Начните на нём говорить.</em></>
              : <>Stop learning English. <em>Start speaking it.</em></>}</h2>
            <button className="ad-btn ad-btn--primary ad-btn--lg" disabled={!authReady} onClick={start}>
              {T('Запустить ИИ-тренажёр бесплатно', 'Launch the AI trainer — free')}<Icon name="arrow" size={18} />
            </button>
            <span className="ad-cta__cap">{T('Без карты · Работает в России', 'No card · Works in Russia')}</span>
          </div>
        </section>
      </main>

      <footer className="ad-foot">
        <div className="ad-shell ad-foot__inner">
          <span className="ad-brand__mark ad-brand__mark--sm">M</span>
          <span>© {new Date().getFullYear()} Mila</span>
        </div>
      </footer>
    </div>
  );
}
