'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LangToggle from '@/components/LangToggle';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import './landing.css';

const WAVE = [28, 52, 76, 42, 68, 92, 58, 34, 74, 100, 62, 46, 84, 56, 30, 70, 48, 80, 38];

export default function HomePage() {
  const { lang } = useI18n();
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'in' | 'out'>('loading');
  const isLoggedIn = sessionStatus === 'in';

  const copy = lang === 'ru'
    ? {
        eyebrow: 'Уроки · произношение · прогресс',
        title: 'Учись по плану —',
        titleAccent: 'расти с каждым уроком.',
        intro: 'Mila превращает язык в понятный путь: проверка уровня, короткие уроки, реальная практика и прогресс, который видно.',
        primary: 'Начать учиться',
        secondary: 'Открыть мой путь',
        free: 'Понятная структура',
        card: 'Следующая практика',
        promptLabel: 'Ситуация дня',
        prompt: '«Заказать кофе спокойно и естественно.»',
        feedbackTitle: 'Один ясный следующий шаг.',
        feedback: 'Сначала фраза, потом произношение, затем короткая практика.',
        tryIt: 'Проверить мой уровень',
        signIn: 'Войти',
        account: 'Кабинет',
        methodTitle: 'Спокойный путь от первого шага к свободной речи.',
        steps: [
          ['01', 'Говори', 'Используй язык, который уже есть.'],
          ['02', 'Учись', 'Получай помощь именно тогда, когда она нужна.'],
          ['03', 'Расти', 'Становись увереннее с каждым настоящим разговором.'],
        ],
        plans: 'Планы',
        privacy: 'Конфиденциальность',
        terms: 'Условия',
      }
    : {
        eyebrow: 'Lessons · pronunciation · progress',
        title: 'Learn with a plan,',
        titleAccent: 'grow with every lesson.',
        intro: 'Mila turns language learning into a clear path: find your level, practise real situations, and see what is improving.',
        primary: 'Start learning',
        secondary: 'Open my learning path',
        free: 'Clear structure',
        card: 'Your next practice',
        promptLabel: 'Today’s situation',
        prompt: '“Order a coffee calmly and naturally.”',
        feedbackTitle: 'One useful next step.',
        feedback: 'Learn the phrase, tune the pronunciation, then use it in a short practice.',
        tryIt: 'Check my level',
        signIn: 'Sign in',
        account: 'My account',
        methodTitle: 'A calm path from the first step to confident speech.',
        steps: [
          ['01', 'Speak', 'Use the language you have.'],
          ['02', 'Learn', 'Get help exactly when you need it.'],
          ['03', 'Grow', 'Build confidence one real conversation at a time.'],
        ],
        plans: 'Plans',
        privacy: 'Privacy',
        terms: 'Terms',
      };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/users/me', { credentials: 'include' })
      .then((response) => {
        if (!cancelled) setSessionStatus(response.ok ? 'in' : 'out');
      })
      .catch(() => {
        if (!cancelled) setSessionStatus('out');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const authHref = (route: '/login' | '/register', returnTo: string) =>
    `${route}?returnTo=${encodeURIComponent(returnTo)}`;

  const startLearning = () =>
    window.location.assign(isLoggedIn ? '/dashboard' : '/start');
  const learningPathHref = isLoggedIn
    ? '/lessons'
    : authHref('/login', '/dashboard');
  const startAssessment = () =>
    window.location.assign(isLoggedIn ? '/assessment' : authHref('/login', '/assessment'));
  const accountHref = isLoggedIn
    ? '/account'
    : authHref('/login', '/account');

  return (
    <div className="lp-minimal">
      <header className="lp-minimal__nav">
        <Link className="lp-minimal__brand" href="/" aria-label="Mila home">
          <span aria-hidden="true">M</span>
          <strong>Mila</strong>
        </Link>

        <div className="lp-minimal__nav-actions">
          <LangToggle />
          <Link className="lp-minimal__account" href={accountHref}>
            {isLoggedIn ? copy.account : copy.signIn}
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-minimal__hero">
          <div className="lp-minimal__copy">
            <p className="lp-minimal__eyebrow">
              <span aria-hidden="true" />
              {copy.eyebrow}
            </p>

            <h1>
              {copy.title}
              <em>{copy.titleAccent}</em>
            </h1>

            <p className="lp-minimal__intro">{copy.intro}</p>

            <div className="lp-minimal__actions">
              <button className="lp-minimal__primary" type="button" onClick={startLearning}>
                {copy.primary}
                <MilaIcon name="arrow" size={20} />
              </button>
              <Link className="lp-minimal__secondary" href={learningPathHref}>
                {copy.secondary}
              </Link>
            </div>

            <p className="lp-minimal__trust">
              <MilaIcon name="lock" size={16} />
              {copy.free}
              <span aria-hidden="true">·</span>
              {lang === 'ru' ? 'Бесплатно начать' : 'Free to start'}
              <span aria-hidden="true">·</span>
              {lang === 'ru' ? 'Приватно' : 'Private'}
            </p>
          </div>

          <aside className="lp-voice-card" aria-label={copy.card}>
            <div className="lp-voice-card__topline">
              <span>{copy.card}</span>
              <i aria-hidden="true" />
            </div>

            <div className="lp-voice-card__prompt">
              <span>{copy.promptLabel}</span>
              <p>{copy.prompt}</p>
            </div>

            <div className="lp-voice-card__wave" aria-hidden="true">
              {WAVE.map((height, index) => (
                <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>

            <div className="lp-voice-card__note">
              <span aria-hidden="true">M</span>
              <p>
                <strong>{copy.feedbackTitle}</strong>
                {copy.feedback}
              </p>
            </div>

            <button className="lp-voice-card__button" type="button" onClick={startAssessment}>
              <MilaIcon name="level" size={20} />
              {copy.tryIt}
            </button>
          </aside>
        </section>

        <section className="lp-method" aria-labelledby="lp-method-title">
          <h2 id="lp-method-title">{copy.methodTitle}</h2>
          <div className="lp-method__steps">
            {copy.steps.map(([number, title, detail]) => (
              <article key={number}>
                <span>{number}</span>
                <p>
                  <strong>{title}</strong>
                  {detail}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="lp-minimal__footer">
        <span>© {new Date().getFullYear()} Mila</span>
        <nav aria-label="Footer">
          <Link href="/pricing">{copy.plans}</Link>
          <Link href="/privacy">{copy.privacy}</Link>
          <Link href="/terms">{copy.terms}</Link>
        </nav>
      </footer>
    </div>
  );
}
