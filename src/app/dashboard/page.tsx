'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import ThemeToggle from '@/components/ThemeToggle';
import StreakCounter from '@/components/StreakCounter';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';

type Learner = {
  name?: string;
  streakDays?: number;
  level?: string;
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
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // The public front door is still the safe destination if logout fails.
    }
    router.push('/');
    router.refresh();
  };

  if (!mounted) return null;

  const firstNameCandidate = user?.name?.trim().split(/\s+/)[0];
  const firstName = firstNameCandidate && !/^(?:guest|гость)$/iu.test(firstNameCandidate) ? firstNameCandidate : '';
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
            <button className="welcome-toolbar__quiet dashboard-toolbar__signout" onClick={handleLogout} type="button">
              {lang === 'ru' ? 'Выйти' : 'Sign out'}
            </button>
          </>
        )}
      />

      <AppMain width="wide" className="dashboard-page__main dashboard-conversation__main">
        <div className="dashboard-intro">
          <p>
            {greeting()}{firstName ? `, ${firstName}` : ''}
            <span aria-hidden> — </span>
            <strong>{lang === 'ru' ? 'Мила рядом.' : 'Mila is here.'}</strong>
          </p>
          <StreakCounter days={user?.streakDays || 0} lang={lang} />
        </div>

        <section className="conversation-stage" aria-labelledby="conversation-stage-title">
          <div className="conversation-stage__copy">
            <p className="conversation-stage__eyebrow">
              <span aria-hidden />
              {lang === 'ru' ? 'Мила готова слушать' : 'Mila is ready to listen'}
            </p>
            <h1 id="conversation-stage-title">
              {lang === 'ru' ? 'О чём хочешь поговорить?' : 'What do you want to say?'}
            </h1>
            <p className="conversation-stage__lede">
              {lang === 'ru'
                ? 'Говори естественно. Мила выслушает, ответит вслух и подскажет одну полезную вещь для твоего английского — без допроса и заученного сценария.'
                : 'Talk naturally. Mila listens, answers aloud, and gives you one useful English cue—without turning every sentence into a test.'}
            </p>

            <div className="conversation-stage__actions">
              <button className="conversation-action conversation-action--voice" type="button" onClick={() => router.push('/darshan')}>
                <span className="conversation-action__icon" aria-hidden><MilaIcon name="voice" size={24} /></span>
                <span>
                  <strong>{lang === 'ru' ? 'Говорить с Милой' : 'Speak with Mila'}</strong>
                  <small>{lang === 'ru' ? 'Живой голосовой разговор' : 'A live voice conversation'}</small>
                </span>
                <MilaIcon name="arrow" size={20} />
              </button>
              <button className="conversation-action conversation-action--chat" type="button" onClick={() => router.push('/chat')}>
                <span className="conversation-action__icon" aria-hidden><MilaIcon name="conversation" size={24} /></span>
                <span>
                  <strong>{lang === 'ru' ? 'Написать Миле' : 'Chat with Mila'}</strong>
                  <small>{lang === 'ru' ? 'Спокойно, в своём темпе' : 'Type at your own pace'}</small>
                </span>
                <MilaIcon name="arrow" size={20} />
              </button>
            </div>

            <ul className="conversation-stage__promises" aria-label={lang === 'ru' ? 'Как работает разговор' : 'How the conversation works'}>
              <li>{lang === 'ru' ? 'Без сценария' : 'No script'}</li>
              <li>{lang === 'ru' ? 'Можно по-русски' : 'Russian is welcome'}</li>
              <li>{lang === 'ru' ? 'Одна полезная подсказка' : 'One useful cue'}</li>
            </ul>
          </div>

          <div className="conversation-stage__presence" aria-hidden="true">
            <div className="conversation-stage__portrait">
              <Image
                src="/mascot/mila-mascot-rose.png"
                alt=""
                width={1254}
                height={1254}
                priority
              />
            </div>
            <div className="conversation-stage__signal">
              <span className="conversation-stage__signal-dot" />
              <span>{lang === 'ru' ? 'Можно начинать' : 'Ready when you are'}</span>
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
