// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import CategoryFilter from '@/components/CategoryFilter';
import LessonList from '@/components/LessonList';
import GenerateLessonButton from '@/components/GenerateLessonButton';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { COURSE_LESSON_IDS, getBuiltinLesson } from '@/lib/builtinLessons';

const CATS_RU = ['Все','Разговор','Фонетика','Слова','Аудирование'];
const CATS_EN = ['All','Speaking','Phonetics','Vocabulary','Listening'];

export default function LessonsPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const [dbLessons, setDbLessons] = useState<any[]>([]);
  const staticLessons = COURSE_LESSON_IDS.map((id) => {
    const lesson = getBuiltinLesson(id)!;
    return {
      id: Number(id), cat: lesson.icon,
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
        cat: '✨',
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
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      <div style={{background:'rgba(0,0,0,0.84)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.3rem',color:C.dark,letterSpacing:'0.03em'}}>Mila</span>
        <LangToggle />
      </div>

      <div style={{maxWidth:600,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,margin:0}}>{t('lessons_title')}</h1>
        <p style={{color:C.warm,margin:'4px 0 20px'}}>{t('lessons_subtitle')}</p>

        <GenerateLessonButton />
        <CategoryFilter categories={cats} active={activeCat} onChange={setActiveCat}/>
        <LessonList lessons={activeCat===0 ? [...filtered, ...dbLessons] : filtered} onSelect={(id)=>router.push(`/lessons/${id}`)}/>
      </div>
    </div>
  );
}
