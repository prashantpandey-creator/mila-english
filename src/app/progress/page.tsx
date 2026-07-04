// @ts-nocheck
'use client';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import ProgressSummary from '@/components/ProgressSummary';
import ProgressRing from '@/components/ProgressRing';
import ProgressChart from '@/components/ProgressChart';
import SkillBreakdown from '@/components/SkillBreakdown';
import WeakAreasAlert from '@/components/WeakAreasAlert';
import StudyStreakCalendar from '@/components/StudyStreakCalendar';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

export default function ProgressPage() {
  const {t,lang}=useI18n(); const router=useRouter();
  const stats=[
    {emoji:'⭐',l:lang==='ru'?'Уроков':'Lessons',v:12,c:C.sage},
    {emoji:'📝',l:lang==='ru'?'Слов':'Words',v:34,c:C.rose},
    {emoji:'⏱',l:lang==='ru'?'Часов':'Hours',v:2.5,c:C.gold},
    {emoji:'🔥',l:lang==='ru'?'Дней подряд':'Day streak',v:5,c:C.purple},
  ];
  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span><LangToggle/>
      </div>
      <div style={{maxWidth:500,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,marginBottom:16}}>{t('progress_title')}</h1>

        <ProgressSummary items={stats.map(s=>({emoji:s.emoji,val:s.v,label:s.l,color:s.c}))}/>

        <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:20}}>
          <ProgressRing percent={68} label={lang==='ru'?'До след. уровня':'To next level'} color={C.rose}/>
          <ProgressRing percent={45} label={lang==='ru'?'Недельная цель':'Weekly goal'} color={C.sage}/>
        </div>

        <ProgressChart lang={lang}/>
        <SkillBreakdown lang={lang}/>
        <WeakAreasAlert lang={lang}/>
        <StudyStreakCalendar lang={lang}/>
      </div>
    </div>
  );
}
