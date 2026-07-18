// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import ThemeToggle from '@/components/ThemeToggle';
import CategoryFilter from '@/components/CategoryFilter';
import LessonList from '@/components/LessonList';
import GenerateLessonButton from '@/components/GenerateLessonButton';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import { useI18n } from '@/lib/i18n-provider';
import { COURSE_LESSON_IDS, getBuiltinLesson } from '@/lib/builtinLessons';
import type { MilaIconName } from '@/components/ui/MilaIcon';

const CATS_RU = ['Все','Разговор','Фонетика','Слова','Аудирование'];
const CATS_EN = ['All','Speaking','Phonetics','Vocabulary','Listening'];

function lessonIcon(id: string, category: string): MilaIconName {
  if (id === '1') return 'conversation';
  if (id === '2') return 'cafe';
  if (id === '3') return 'travel';
  if (category === 'Фонетика' || category === 'Phonetics') return 'phonetics';
  if (category === 'Слова' || category === 'Vocabulary') return 'vocabulary';
  if (category === 'Аудирование' || category === 'Listening') return 'listening';
  return 'lesson';
}

export default function LessonsPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const [dbLessons, setDbLessons] = useState<any[]>([]);
  const staticLessons = COURSE_LESSON_IDS.map((id) => {
    const lesson = getBuiltinLesson(id)!;
    return {
      id: Number(id), icon: lessonIcon(id, lesson.categoryRu),
      catName: lang === 'ru' ? lesson.categoryRu : lesson.categoryEn,
      title: lang === 'ru' ? lesson.titleRu : lesson.titleEn,
      sub: lang === 'ru' ? lesson.subtitleRu : lesson.subtitleEn,
      time: `${lesson.durationMinutes} ${lang === 'ru' ? 'мин' : 'min'}`,
      diff: lang === 'ru' ? ['Лёгкий', 'Средний', 'Сложный'][lesson.difficulty - 1] : ['Easy', 'Medium', 'Hard'][lesson.difficulty - 1],
      diffNum: lesson.difficulty,
      words: lesson.words,
    };
  });
  const cats = lang==='ru' ? CATS_RU : CATS_EN;

  // AI-generated lessons live in the DB — fetch and show them alongside the built-in ones.
  useEffect(() => {
    fetch('/api/lessons')
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => setDbLessons(Array.isArray(rows) ? rows.map(l => ({
        id: `ai-${l.id}`,   // prefixed — static lessons own the bare 1..8 ids
        icon: 'sparkle' as const,
        title: l.title,
        sub: l.category || (lang==='ru' ? 'Урок от ИИ' : 'AI-generated lesson'),
        time: `${l.durationMinutes || 5} ${lang==='ru' ? 'мин' : 'min'}`,
        diffNum: Math.min(Math.max(l.difficulty || 1, 1), 3),
      })) : []))
      .catch(() => setDbLessons([]));
  }, [lang]);

  const lessons = staticLessons;

  const filtered = activeCat === 0 ? lessons : lessons.filter(l => {
    const catName = lang==='ru' ? l.catName : l.catName;
    return catName === cats[activeCat] ||
      (cats[activeCat]==='Speaking' && l.catName==='Разговор') ||
      (cats[activeCat]==='Phonetics' && l.catName==='Фонетика') ||
      (cats[activeCat]==='Vocabulary' && l.catName==='Слова') ||
      (cats[activeCat]==='Listening' && l.catName==='Аудирование');
  });

  return (
    <AppShell className="welcome-page lessons-page">
      <AppHeader
        className="lessons-page__header"
        title={t('lessons_title')}
        actions={<>
          <LangToggle />
          <ThemeToggle />
        </>}
      />

      <AppMain width="work" className="lessons-page__main">
        <div className="product-intro">
          <p className="product-intro__kicker">{lang==='ru'?'Выбери сцену':'Choose a scene'}</p>
          <p className="product-intro__copy">{t('lessons_subtitle')}</p>
        </div>

        <GenerateLessonButton />
        <CategoryFilter categories={cats} active={activeCat} onChange={setActiveCat}/>
        <LessonList lessons={activeCat===0 ? [...filtered, ...dbLessons] : filtered} onSelect={(id)=>router.push(`/lessons/${id}`)}/>
      </AppMain>
    </AppShell>
  );
}
