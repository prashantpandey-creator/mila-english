// @ts-nocheck
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LangToggle from '@/components/LangToggle';
import BadgeGrid from '@/components/BadgeGrid';
import StreakBadge from '@/components/StreakBadge';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

const BADGES_RU=[{id:'first-lesson',icon:'flower' as const,t:'Первый урок',d:'Пройди свой первый урок'},{id:'three-day-streak',icon:'streak' as const,t:'3 дня подряд',d:'Занимайся три дня без перерыва'},{id:'ten-words',icon:'vocabulary' as const,t:'10 слов',d:'Выучи 10 новых слов'},{id:'voice',icon:'voice' as const,t:'Голос',d:'Попрактикуй произношение'},{id:'five-lessons',icon:'lessons' as const,t:'5 уроков',d:'Пройди пять уроков'},{id:'perfect-score',icon:'trophy' as const,t:'Мастер',d:'Набери 100 очков'}];
const BADGES_EN=[{id:'first-lesson',icon:'flower' as const,t:'First Lesson',d:'Complete your first lesson'},{id:'three-day-streak',icon:'streak' as const,t:'3 Day Streak',d:'Study three days in a row'},{id:'ten-words',icon:'vocabulary' as const,t:'10 Words',d:'Learn 10 new words'},{id:'voice',icon:'voice' as const,t:'Voice',d:'Practice pronunciation'},{id:'five-lessons',icon:'lessons' as const,t:'5 Lessons',d:'Complete five lessons'},{id:'perfect-score',icon:'trophy' as const,t:'Master',d:'Score 100 points'}];

export default function AchievementsPage() {
  const {t,lang}=useI18n(); const router=useRouter();
  const [data,setData]=useState<any>({streakDays:0,badges:[]});
  useEffect(()=>{fetch('/api/achievements').then(r=>r.ok?r.json():null).then(d=>{if(d)setData(d)}).catch(()=>{})},[]);
  const unlocked=new Map(data.badges.map((badge:any)=>[badge.id,badge.unlocked]));
  const badges=(lang==='ru'?BADGES_RU:BADGES_EN).map(badge=>({...badge,u:Boolean(unlocked.get(badge.id))}));
  return (
    <div className="welcome-page" style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      <div className="welcome-toolbar" style={{background:C.navBg,backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:`1px solid ${C.line}`,display:'flex',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontFamily:"var(--font-display, 'Manrope'),sans-serif",fontWeight:700,fontSize:'1.3rem',color:C.dark,letterSpacing:'-0.03em'}}>Mila</span><LangToggle/>
      </div>
      <div style={{maxWidth:500,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,marginBottom:16}}>{t('achievements_title')}</h1>
        <StreakBadge days={data.streakDays} lang={lang}/>
        <BadgeGrid badges={badges}/>
      </div>
    </div>
  );
}
