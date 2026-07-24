'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import MilaIcon from '@/components/ui/MilaIcon';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import { useI18n } from '@/lib/i18n-provider';
import { selectCurrentAssessmentLesson } from '@/lib/assessmentResult';
import './result.css';

type LearnerProfile = {
  strengths: string[];
  weak_summary: string;
  learner_arc: string;
  focus: string[];
};

type ResultState = {
  name: string;
  level: string;
  profile: LearnerProfile;
  lesson: { id: number; title: string } | null;
};

const EMPTY_PROFILE: LearnerProfile = { strengths: [], weak_summary: '', learner_arc: '', focus: [] };

function readProfile(value: unknown): LearnerProfile {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object') return EMPTY_PROFILE;
    const candidate = parsed as Partial<LearnerProfile>;
    return {
      strengths: Array.isArray(candidate.strengths) ? candidate.strengths.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [],
      weak_summary: typeof candidate.weak_summary === 'string' ? candidate.weak_summary : '',
      learner_arc: typeof candidate.learner_arc === 'string' ? candidate.learner_arc : '',
      focus: Array.isArray(candidate.focus) ? candidate.focus.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [],
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export default function AssessmentResultPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState(false);
  const T = (ru: string, en: string) => lang === 'ru' ? ru : en;

  useEffect(() => {
    const controller = new AbortController();
    const requestedLessonId = new URLSearchParams(window.location.search).get('lesson');
    Promise.all([
      fetch('/api/users/me', { cache: 'no-store', signal: controller.signal }),
      fetch('/api/profile', { cache: 'no-store', signal: controller.signal }),
      fetch('/api/lessons', { cache: 'no-store', signal: controller.signal }),
    ]).then(async ([meResponse, profileResponse, lessonsResponse]) => {
      if (!meResponse.ok) {
        router.replace('/login?returnTo=%2Fassessment%2Fresult');
        return;
      }
      const me = await meResponse.json();
      const fetchedProfile = profileResponse.ok ? readProfile(await profileResponse.json()) : EMPTY_PROFILE;
      const savedProfile = readProfile(me.learnerProfile);
      const profile = fetchedProfile.focus.length || fetchedProfile.strengths.length || fetchedProfile.weak_summary
        ? fetchedProfile
        : savedProfile;
      const lessons = lessonsResponse.ok ? await lessonsResponse.json() : [];
      // The finalize response names the lesson created for this exact
      // assessment. With no such ID (including generation failure), never fall
      // back to an older generated lesson and present it as the current result.
      const lesson = selectCurrentAssessmentLesson(lessons, requestedLessonId);
      setResult({
        name: typeof me.name === 'string' ? me.name : '',
        level: typeof me.level === 'string' && me.level !== 'pending' ? me.level.toUpperCase() : T('Определён', 'Placed'),
        profile,
        lesson: lesson ? { id: lesson.id, title: String(lesson.title || T('Твой первый личный урок', 'Your first custom lesson')) } : null,
      });
    }).catch((nextError) => {
      if ((nextError as Error)?.name !== 'AbortError') setError(true);
    });
    return () => controller.abort();
  }, [router, lang]);

  return (
    <AppShell className="assessment-result">
      <AppHeader backHref="/dashboard" title={T('Результат', 'Your result')} actions={<LangToggle />} />
      <AppMain width="work" className="assessment-result__main">
        {!result && !error ? <div className="assessment-result__loading">{T('Собираем твой учебный путь…', 'Preparing your learning path…')}</div> : null}
        {error ? (
          <section className="assessment-result__panel assessment-result__panel--center" role="alert">
            <h1>{T('Результат сохранён', 'Your result is saved')}</h1>
            <p>{T('Сейчас не удалось загрузить подробности. Их можно открыть позже из аккаунта.', 'We could not load the details just now. You can return to them from your account.')}</p>
            <button type="button" onClick={() => router.push('/dashboard')}>{T('В кабинет', 'Go to dashboard')}</button>
          </section>
        ) : null}
        {result ? (
          <div className="assessment-result__stack">
            <section className="assessment-result__hero">
              <span className="assessment-result__eyebrow"><MilaIcon name="level" size={17} />{T('ТВОЯ ОТПРАВНАЯ ТОЧКА', 'YOUR STARTING POINT')}</span>
              <div className="assessment-result__level">{result.level}</div>
              <h1>{T('FluentMitra определила, с чего лучше начать.', 'FluentMitra found your best starting point.')}</h1>
              <p>{T('Это не оценка и не ярлык. Это ориентир, чтобы следующая практика была подходящей именно тебе.', 'This is not a grade or a label. It is a starting point that makes your next practice fit you.')}</p>
            </section>

            <div className="assessment-result__grid">
              <section className="assessment-result__panel">
                <span className="assessment-result__panel-icon"><MilaIcon name="sparkle" size={22} /></span>
                <h2>{T('Что уже получается', 'What already works')}</h2>
                {result.profile.strengths.length ? (
                  <ul>{result.profile.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : <p>{T('Сильные стороны появятся здесь по мере практики.', 'Your strengths will become clearer as you practise.')}</p>}
              </section>

              <section className="assessment-result__panel">
                <span className="assessment-result__panel-icon"><MilaIcon name="target" size={22} /></span>
                <h2>{T('Следующий фокус', 'Your next focus')}</h2>
                {result.profile.focus.length ? (
                  <ul>{result.profile.focus.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : <p>{result.profile.weak_summary || T('Начни с короткого урока — FluentMitra уточнит фокус по ходу.', 'Start with a short lesson and FluentMitra will refine the focus as you go.')}</p>}
              </section>
            </div>

            <section className="assessment-result__next">
              <div>
                <span className="assessment-result__eyebrow"><MilaIcon name="lesson" size={17} />{T('РЕКОМЕНДУЕМ ДАЛЬШЕ', 'RECOMMENDED NEXT')}</span>
                <h2>{result.lesson?.title || T('Выбери первый короткий урок', 'Choose your first short lesson')}</h2>
                <p>{result.profile.learner_arc || T('Пять минут достаточно, чтобы превратить результат в практику.', 'Five minutes is enough to turn this result into practice.')}</p>
              </div>
              <button type="button" onClick={() => router.push(result.lesson ? `/lessons/ai-${result.lesson.id}` : '/lessons')}>
                {T('Начать урок', 'Start the lesson')}<MilaIcon name="arrow" size={18} />
              </button>
            </section>
            <button className="assessment-result__quiet" type="button" onClick={() => router.push('/dashboard')}>{T('Вернуться в кабинет', 'Return to dashboard')}</button>
          </div>
        ) : null}
      </AppMain>
    </AppShell>
  );
}
