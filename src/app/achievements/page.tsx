// @ts-nocheck
'use client';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import BadgeGrid from '@/components/BadgeGrid';
import StreakBadge from '@/components/StreakBadge';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

const BADGES_RU=[{e:'🌸',t:'Первый урок',d:'Пройди свой первый урок',u:!0},{e:'🔥',t:'3 дня подряд',d:'Занимайся три дня без перерыва',u:!0},{e:'📝',t:'10 слов',d:'Выучи 10 новых слов',u:!0},{e:'🎤',t:'Голос',d:'Попрактикуй произношение',u:!1},{e:'⭐',t:'5 уроков',d:'Пройди пять уроков',u:!1},{e:'🏆',t:'Мастер',d:'Набери 100 очков',u:!1}];
const BADGES_EN=[{e:'🌸',t:'First Lesson',d:'Complete your first lesson',u:!0},{e:'🔥',t:'3 Day Streak',d:'Study three days in a row',u:!0},{e:'📝',t:'10 Words',d:'Learn 10 new words',u:!0},{e:'🎤',t:'Voice',d:'Practice pronunciation',u:!1},{e:'⭐',t:'5 Lessons',d:'Complete five lessons',u:!1},{e:'🏆',t:'Master',d:'Score 100 points',u:!1}];

export default function AchievementsPage() {
  const {t,lang}=useI18n(); const router=useRouter();
  const badges=lang==='ru'?BADGES_RU:BADGES_EN;
  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      <div style={{background:'rgba(13,16,23,0.72)',backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span><LangToggle/>
      </div>
      <div style={{maxWidth:500,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,marginBottom:16}}>{t('achievements_title')}</h1>
        <StreakBadge days={5} lang={lang}/>
        <BadgeGrid badges={badges}/>
      </div>
    </div>
  );
}
