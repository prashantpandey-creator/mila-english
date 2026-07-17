// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import LangToggle from '@/components/LangToggle';
import ThemeToggle from '@/components/ThemeToggle';
import BadgeGrid from '@/components/BadgeGrid';
import StreakBadge from '@/components/StreakBadge';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import { useI18n } from '@/lib/i18n-provider';

const BADGES_RU=[{id:'first-lesson',icon:'flower' as const,t:'Первый урок',d:'Пройди свой первый урок'},{id:'three-day-streak',icon:'streak' as const,t:'3 дня подряд',d:'Занимайся три дня без перерыва'},{id:'ten-words',icon:'vocabulary' as const,t:'10 слов',d:'Выучи 10 новых слов'},{id:'voice',icon:'voice' as const,t:'Голос',d:'Попрактикуй произношение'},{id:'five-lessons',icon:'lessons' as const,t:'5 уроков',d:'Пройди пять уроков'},{id:'perfect-score',icon:'trophy' as const,t:'Мастер',d:'Набери 100 очков'}];
const BADGES_EN=[{id:'first-lesson',icon:'flower' as const,t:'First Lesson',d:'Complete your first lesson'},{id:'three-day-streak',icon:'streak' as const,t:'3 Day Streak',d:'Study three days in a row'},{id:'ten-words',icon:'vocabulary' as const,t:'10 Words',d:'Learn 10 new words'},{id:'voice',icon:'voice' as const,t:'Voice',d:'Practice pronunciation'},{id:'five-lessons',icon:'lessons' as const,t:'5 Lessons',d:'Complete five lessons'},{id:'perfect-score',icon:'trophy' as const,t:'Master',d:'Score 100 points'}];

export default function AchievementsPage() {
  const {t,lang}=useI18n();
  const [data,setData]=useState<any>({streakDays:0,badges:[]});
  useEffect(()=>{fetch('/api/achievements').then(r=>r.ok?r.json():null).then(d=>{if(d)setData(d)}).catch(()=>{})},[]);
  const unlocked=new Map(data.badges.map((badge:any)=>[badge.id,badge.unlocked]));
  const badges=(lang==='ru'?BADGES_RU:BADGES_EN).map(badge=>({...badge,u:Boolean(unlocked.get(badge.id))}));
  return (
    <AppShell className="welcome-page achievements-page">
      <AppHeader
        className="achievements-page__header"
        title={t('achievements_title')}
        actions={<><LangToggle/><ThemeToggle/></>}
      />
      <AppMain width="compact" className="achievements-page__main">
        <StreakBadge days={data.streakDays} lang={lang}/>
        <BadgeGrid badges={badges}/>
      </AppMain>
    </AppShell>
  );
}
