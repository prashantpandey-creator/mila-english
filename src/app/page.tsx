'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import './landing.css';

const WAVE = [28, 52, 76, 42, 68, 92, 58, 34, 74, 100, 62, 46, 84, 56, 30, 70, 48, 80, 38];

export default function HomePage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'in' | 'out'>('loading');
  const isLoggedIn = sessionStatus === 'in';

  const copy = lang === 'ru'
    ? {
        eyebrow: 'Личная практика английского',
        title: 'Английский —',
        titleAccent: 'вашим голосом.',
        intro: 'Говорите свободно. Mila слушает, исправляет по одному нюансу и помогает звучать естественно.',
        primary: 'Поговорить с Mila',
        returning: 'Продолжить с Mila',
        secondary: 'Проверить мой уровень',
        free: 'Начать бесплатно',
        card: 'Mila слушает',
        promptLabel: 'Скажите по-английски',
        feedbackTitle: 'Звучит естественно.',
        feedback: 'Попробуйте “I ended up…” — так рассказ будет звучать плавнее.',
        tryIt: 'Попробовать своим голосом',
        signIn: 'Войти',
        account: 'Кабинет',
        methodTitle: 'Простая практика. Реальный прогресс.',
        steps: [
          ['01', 'Говорите', 'Без сценария и стеснения.'],
          ['02', 'Получите подсказку', 'Один ясный следующий шаг.'],
          ['03', 'Повторите', 'Пока речь не станет вашей.'],
        ],
        plans: 'Планы',
        privacy: 'Конфиденциальность',
        terms: 'Условия',
      }
    : {
        eyebrow: 'Private English practice',
        title: 'English,',
        titleAccent: 'in your own voice.',
        intro: 'Speak freely. Mila listens, fixes one thing at a time, and helps you sound like yourself.',
        primary: 'Speak with Mila',
        returning: 'Continue with Mila',
        secondary: 'Check my level',
        free: 'Free to start',
        card: 'Mila is listening',
        promptLabel: 'Say this in your own words',
        feedbackTitle: 'That sounded natural.',
        feedback: 'Try “I ended up…” to make the story flow more easily.',
        tryIt: 'Try it with my voice',
        signIn: 'Sign in',
        account: 'My account',
        methodTitle: 'Simple practice. Real progress.',
        steps: [
          ['01', 'Speak', 'No script. No pressure.'],
          ['02', 'Get one clear note', 'A useful next step, not a score.'],
          ['03', 'Try again', 'Until the English feels like yours.'],
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

  // Mila now asks a signed-out learner to deliberately sign in, register, or
  // continue as a guest before entering any app room.
  const startSpeaking = () =>
    router.push(isLoggedIn ? '/darshan?free=1' : authHref('/login', '/darshan?free=1'));
  const assessmentHref = isLoggedIn
    ? '/assessment'
    : authHref('/register', '/assessment');
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
              <button className="lp-minimal__primary" type="button" onClick={startSpeaking}>
                {isLoggedIn ? copy.returning : copy.primary}
                <MilaIcon name="arrow" size={20} />
              </button>
              <Link className="lp-minimal__secondary" href={assessmentHref}>
                {copy.secondary}
              </Link>
            </div>

            <p className="lp-minimal__trust">
              <MilaIcon name="lock" size={16} />
              {copy.free}
              <span aria-hidden="true">·</span>
              {lang === 'ru' ? 'Без карты' : 'No card'}
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
              <p>“Tell me about your day.”</p>
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

            <button className="lp-voice-card__button" type="button" onClick={startSpeaking}>
              <MilaIcon name="voice" size={20} />
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
