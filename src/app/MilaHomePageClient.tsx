'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LangToggle from '@/components/LangToggle';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import { MILA_PUBLIC_BRAND } from '@/lib/milaBrand';
import './landing.css';

const WAVE = [28, 52, 76, 42, 68, 92, 58, 34, 74, 100, 62, 46, 84, 56, 30, 70, 48, 80, 38];

export default function MilaHomePageClient() {
  const { lang } = useI18n();
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'in' | 'out'>('loading');
  const isLoggedIn = sessionStatus === 'in';

  const copy = lang === 'ru'
    ? {
        eyebrow: 'РАЗГОВОР · УВЕРЕННОСТЬ · ЛЮБОПЫТСТВО',
        title: 'Найди свой голос —',
        titleAccent: 'на любом языке.',
        intro: 'Mila помогает говорить, думать и становиться увереннее — один настоящий разговор за другим.',
        voice: 'Поговорить с Mila',
        returning: 'Продолжить с Mila',
        text: 'Написать Mila',
        learn: 'Учить английский',
        card: 'Mila слушает',
        promptLabel: 'Скажи по-своему',
        prompt: '«Расскажи, что сейчас у тебя на уме.»',
        feedbackTitle: 'Начни прямо отсюда.',
        feedback: 'Голосом или текстом — Mila ответит на языке, который выберешь ты.',
        startVoice: 'Начать голосом',
        signIn: 'Войти',
        account: 'Моё обучение',
        methodTitle: 'Разговор — это и есть начало.',
        steps: [
          ['01', 'Говори', 'Начни на языке, который уже есть.'],
          ['02', 'Исследуй', 'Разбирай мысли, идеи и настоящие ситуации.'],
          ['03', 'Учись', 'Открывай английскую программу, когда она нужна.'],
        ],
        privacy: 'Конфиденциальность',
        terms: 'Условия',
        support: 'Поддержка',
      }
    : {
        eyebrow: 'CONVERSATION · CONFIDENCE · CURIOSITY',
        title: 'Find your voice,',
        titleAccent: 'in any language.',
        intro: 'Mila helps you speak, think, and grow into a more confident version of yourself—one real conversation at a time.',
        voice: 'Talk with Mila',
        returning: 'Continue with Mila',
        text: 'Text with Mila',
        learn: 'Learn English',
        card: 'Mila is listening',
        promptLabel: 'Say it your way',
        prompt: '“Tell me what is on your mind right now.”',
        feedbackTitle: 'Begin exactly here.',
        feedback: 'Voice or text—Mila follows the language and direction you choose.',
        startVoice: 'Start with my voice',
        signIn: 'Sign in',
        account: 'My learning',
        methodTitle: 'Conversation is the beginning.',
        steps: [
          ['01', 'Speak', 'Begin with the language you already have.'],
          ['02', 'Explore', 'Work through thoughts, ideas, and real situations.'],
          ['03', 'Learn', 'Open structured English learning when you want it.'],
        ],
        privacy: 'Privacy',
        terms: 'Terms',
        support: 'Support',
      };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/users/me', { credentials: 'include', cache: 'no-store' })
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

  const startVoiceConversation = () => {
    window.dispatchEvent(new CustomEvent('mila-voice-mode'));
  };

  const startTextConversation = () => {
    window.dispatchEvent(new CustomEvent('mila-text-chat'));
  };

  const accountHref = isLoggedIn ? '/dashboard' : '/login?returnTo=%2Fdashboard';

  return (
    <div className="lp-minimal">
      <header className="lp-minimal__nav">
        <Link className="lp-minimal__brand" href="/" aria-label="Mila home">
          <span aria-hidden="true" />
          <strong>{MILA_PUBLIC_BRAND.name}</strong>
        </Link>

        <div className="lp-minimal__nav-actions">
          <Link className="lp-minimal__market" href="/start">{copy.learn}</Link>
          <LangToggle />
          {sessionStatus === 'loading' ? (
            <span className="lp-minimal__account lp-minimal__account--loading">Checking…</span>
          ) : (
            <Link className="lp-minimal__account" href={accountHref}>
              {isLoggedIn ? copy.account : copy.signIn}
            </Link>
          )}
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
              <button className="lp-minimal__primary" type="button" onClick={startVoiceConversation}>
                {isLoggedIn ? copy.returning : copy.voice}
                <MilaIcon name="voice" size={20} />
              </button>
              <button className="lp-minimal__secondary" type="button" onClick={startTextConversation}>
                {copy.text}
              </button>
            </div>

            <p className="lp-minimal__trust">
              <MilaIcon name="lock" size={16} />
              {lang === 'ru' ? 'Любой язык' : 'Any language'}
              <span aria-hidden="true">·</span>
              {lang === 'ru' ? 'Бесплатно начать' : 'Free to start'}
              <span aria-hidden="true">·</span>
              {lang === 'ru' ? 'Приватный режим доступен' : 'Private path available'}
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
                <i key={String(height) + '-' + String(index)} style={{ height: String(height) + '%' }} />
              ))}
            </div>

            <div className="lp-voice-card__note">
              <span aria-hidden="true">M</span>
              <p>
                <strong>{copy.feedbackTitle}</strong>
                {copy.feedback}
              </p>
            </div>

            <button className="lp-voice-card__button" type="button" onClick={startVoiceConversation}>
              <MilaIcon name="voice" size={20} />
              {copy.startVoice}
            </button>
          </aside>
        </section>

        <section className="lp-method" aria-labelledby="lp-method-title">
          <h2 id="lp-method-title">{copy.methodTitle}</h2>
          <div className="lp-method__steps">
            {copy.steps.map(([number, title, detail]) => (
              <article key={number}>
                <span>{number}</span>
                <p><strong>{title}</strong>{detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="lp-minimal__footer">
        <span>© {new Date().getFullYear()} Mila</span>
        <nav aria-label="Footer">
          <Link href="/support">{copy.support}</Link>
          <Link href="/privacy">{copy.privacy}</Link>
          <Link href="/terms">{copy.terms}</Link>
        </nav>
      </footer>
    </div>
  );
}
