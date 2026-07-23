'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import ThemeToggle from '@/components/ThemeToggle';
import StreakCounter from '@/components/StreakCounter';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import MilaVoiceMark from '@/components/ui/MilaVoiceMark';
import { useI18n } from '@/lib/i18n-provider';
import { MIACHAT_ORIGIN } from '@/lib/productHosts';

type Learner = {
  name?: string;
  streakDays?: number;
  level?: string;
  isGuest?: boolean;
  subscription?: { plan: 'free' | 'pro'; isPaid: boolean; status: string; renewsAt: string | null };
};

type Progress = {
  completedLessons: number;
  totalTimeSeconds: number;
  avgScore: number;
};

export default function DashboardPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<Learner | null>(null);
  const [stats, setStats] = useState<Progress | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    setMounted(true);
    fetch('/api/users/me').then((response) => response.ok ? response.json() : null).then((data) => {
      if (data) setUser(data);
    }).catch(() => {});
    fetch('/api/progress').then((response) => response.ok ? response.json() : null).then((data) => {
      if (data) setStats(data);
    }).catch(() => {});
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return lang === 'ru' ? 'Доброе утро' : 'Good morning';
    if (hour < 17) return lang === 'ru' ? 'Добрый день' : 'Good afternoon';
    return lang === 'ru' ? 'Добрый вечер' : 'Good evening';
  };

  const handleLogout = async () => {
    setSigningOut(true);
    setLogoutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('logout failed');
      router.push('/');
      router.refresh();
    } catch {
      setLogoutError(lang === 'ru' ? 'Не удалось выйти. Проверь соединение и попробуй ещё раз.' : 'Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  };

  if (!mounted) return null;

  const firstNameCandidate = user?.name?.trim().split(/\s+/)[0];
  const firstName = firstNameCandidate && !/^(?:guest|гость)$/iu.test(firstNameCandidate) ? firstNameCandidate : '';
  const isPro = !!user?.subscription?.isPaid;
  const practiceRoutes: Array<{
    icon: MilaIconName;
    labelEn: string;
    labelRu: string;
    detailEn: string;
    detailRu: string;
    href: string;
  }> = [
    {
      icon: 'lessons',
      labelEn: 'Continue a lesson',
      labelRu: 'Продолжить урок',
      detailEn: 'Choose a real-life topic',
      detailRu: 'Выбрать тему из жизни',
      href: '/lessons',
    },
    {
      icon: 'listening',
      labelEn: 'Train your ear',
      labelRu: 'Тренировать слух',
      detailEn: 'Hear, notice and repeat',
      detailRu: 'Слушать, замечать, повторять',
      href: '/listen',
    },
    {
      icon: 'phonetics',
      labelEn: 'Polish a sound',
      labelRu: 'Поставить звук',
      detailEn: 'See exactly what to change',
      detailRu: 'Понять, что именно изменить',
      href: '/phonetics',
    },
    {
      icon: 'vocabulary',
      labelEn: 'Review your words',
      labelRu: 'Повторить слова',
      detailEn: 'Return to saved vocabulary',
      detailRu: 'Вернуться к сохранённым словам',
      href: '/vocabulary',
    },
  ];

  return (
    <AppShell className="welcome-dashboard dashboard-page dashboard-conversation">
      <AppHeader
        backHref="/"
        className="dashboard-page__header"
        actions={(
          <>
            <LangToggle />
            <ThemeToggle />
            <button className="welcome-toolbar__quiet dashboard-toolbar__account" onClick={() => router.push('/account')} type="button">
              <span>{!user ? '···' : isPro ? 'PRO' : 'FREE'}</span>
              {lang === 'ru' ? 'Аккаунт' : 'Account'}
            </button>
            <button className="welcome-toolbar__quiet dashboard-toolbar__signout" onClick={handleLogout} type="button" disabled={signingOut}>
              {signingOut ? (lang === 'ru' ? 'Выходим…' : 'Signing out…') : (lang === 'ru' ? 'Выйти' : 'Sign out')}
            </button>
          </>
        )}
      />

      <AppMain width="wide" className="dashboard-page__main dashboard-conversation__main">
        {logoutError ? <p className="product-status" role="alert">{logoutError}</p> : null}
        <div className="dashboard-intro">
          <p>
            {greeting()}{firstName ? `, ${firstName}` : ''}
            <span aria-hidden> — </span>
            <strong>{lang === 'ru' ? 'Твой маршрут готов.' : 'Your learning path is ready.'}</strong>
          </p>
          <StreakCounter days={user?.streakDays || 0} lang={lang} />
        </div>

        <section className="conversation-stage" aria-labelledby="conversation-stage-title">
          <div className="conversation-stage__copy">
            <p className="conversation-stage__eyebrow">
              <span aria-hidden />
              {lang === 'ru' ? 'Твой путь в языке' : 'Your language path'}
            </p>
            <h1 id="conversation-stage-title">
              {lang === 'ru' ? 'Что хочешь освоить сегодня?' : 'What do you want to practise today?'}
            </h1>
            <p className="conversation-stage__lede">
              {lang === 'ru'
                ? 'Продолжай личный маршрут: короткие уроки, тренировка слуха, произношение и слова, которые пригодятся в реальной жизни.'
                : 'Keep building your personal path through short lessons, listening, pronunciation, and useful real-world language.'}
            </p>

            <div className="conversation-stage__actions">
              <button className="conversation-action conversation-action--voice" type="button" onClick={() => router.push('/lessons')}>
                <span className="conversation-action__icon" aria-hidden><MilaIcon name="lessons" size={24} /></span>
                <span>
                  <strong>{lang === 'ru' ? 'Продолжить обучение' : 'Continue learning'}</strong>
                  <small>{lang === 'ru' ? 'Уроки по твоим целям' : 'Lessons shaped around your goals'}</small>
                </span>
                <MilaIcon name="arrow" size={20} />
              </button>
              <button className="conversation-action conversation-action--chat" type="button" onClick={() => window.location.assign(MIACHAT_ORIGIN)}>
                <span className="conversation-action__icon" aria-hidden><MilaIcon name="conversation" size={24} /></span>
                <span>
                  <strong>{lang === 'ru' ? 'Открыть MiaChat' : 'Open MiaChat'}</strong>
                  <small>{lang === 'ru' ? 'Голосовой и текстовый ИИ-компаньон' : 'Your voice and text AI companion'}</small>
                </span>
                <MilaIcon name="arrow" size={20} />
              </button>
            </div>

            <ul className="conversation-stage__promises" aria-label={lang === 'ru' ? 'Как устроено обучение' : 'How learning works'}>
              <li>{lang === 'ru' ? 'Личный маршрут' : 'Personal path'}</li>
              <li>{lang === 'ru' ? 'Практика из жизни' : 'Real-world practice'}</li>
              <li>{lang === 'ru' ? 'Прогресс сохраняется' : 'Progress remembered'}</li>
            </ul>
          </div>

          <div className="conversation-stage__presence" aria-hidden="true">
            <div className="conversation-stage__portrait">
              <MilaVoiceMark size={220} />
            </div>
            <div className="conversation-stage__signal">
              <span className="conversation-stage__signal-dot" />
              <span>{lang === 'ru' ? 'Следующий шаг готов' : 'Your next step is ready'}</span>
            </div>
            <div className="conversation-stage__wave" aria-hidden="true">
              {Array.from({ length: 15 }, (_, index) => <i key={index} />)}
            </div>
          </div>
        </section>

        <section className="dashboard-support" aria-labelledby="dashboard-support-title">
          <div className="dashboard-support__heading">
            <div>
              <p>{lang === 'ru' ? 'Если хочется позаниматься точечно' : 'When you want focused practice'}</p>
              <h2 id="dashboard-support-title">{lang === 'ru' ? 'Другой путь на сегодня' : 'Another path for today'}</h2>
            </div>
            <div className="dashboard-support__progress" aria-label={lang === 'ru' ? 'Краткий прогресс' : 'Progress summary'}>
              <span><strong>{stats?.completedLessons ?? '—'}</strong>{lang === 'ru' ? 'уроков' : 'lessons'}</span>
              <span><strong>{stats ? Math.round(stats.totalTimeSeconds / 60) : '—'}</strong>{lang === 'ru' ? 'минут' : 'minutes'}</span>
            </div>
          </div>

          <div className="dashboard-practice-grid">
            {practiceRoutes.map((item) => (
              <button className="dashboard-practice-card" type="button" key={item.href} onClick={() => router.push(item.href)}>
                <span className="dashboard-practice-card__icon" aria-hidden><MilaIcon name={item.icon} size={25} /></span>
                <span className="dashboard-practice-card__copy">
                  <strong>{lang === 'ru' ? item.labelRu : item.labelEn}</strong>
                  <small>{lang === 'ru' ? item.detailRu : item.detailEn}</small>
                </span>
                <MilaIcon name="arrow" size={18} />
              </button>
            ))}
          </div>

          {user?.level === 'pending' ? (
            <button className="dashboard-level-check" type="button" onClick={() => router.push('/assessment')}>
              <span><MilaIcon name="level" size={21} /></span>
              <span>
                <strong>{lang === 'ru' ? 'Не знаешь, с чего начать?' : 'Not sure where to begin?'}</strong>
                <small>{lang === 'ru' ? 'Пятиминутная проверка уровня даст Миле отправную точку.' : 'A five-minute level check gives Mila a useful starting point.'}</small>
              </span>
              <span className="dashboard-level-check__action">{lang === 'ru' ? 'Проверить' : 'Check my level'} <MilaIcon name="arrow" size={17} /></span>
            </button>
          ) : null}
          <button className="dashboard-bug-report" type="button" onClick={() => router.push('/support')}>
            <span aria-hidden>↗</span>
            {lang === 'ru' ? 'Сообщить об ошибке в Mila' : 'Report a problem with Mila'}
          </button>
        </section>
      </AppMain>
    </AppShell>
  );
}
