// @ts-nocheck
'use client';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

const C={rose:'#e91e63',roseL:'#fce4ec',sage:'#5b8c5a',gold:'#f59e0b',goldL:'#fef3c7',warm:'#78716c',dark:'#44403c'};

const BADGES_RU=[{e:'🌸',t:'Первый урок',d:'Пройди свой первый урок',u:!0},{e:'🔥',t:'3 дня подряд',d:'Занимайся три дня без перерыва',u:!0},{e:'📝',t:'10 слов',d:'Выучи 10 новых слов',u:!0},{e:'🎤',t:'Голос',d:'Попрактикуй произношение',u:!1},{e:'⭐',t:'5 уроков',d:'Пройди пять уроков',u:!1},{e:'🏆',t:'Мастер',d:'Набери 100 очков',u:!1}];
const BADGES_EN=[{e:'🌸',t:'First Lesson',d:'Complete your first lesson',u:!0},{e:'🔥',t:'3 Day Streak',d:'Study three days in a row',u:!0},{e:'📝',t:'10 Words',d:'Learn 10 new words',u:!0},{e:'🎤',t:'Voice',d:'Practice pronunciation',u:!1},{e:'⭐',t:'5 Lessons',d:'Complete five lessons',u:!1},{e:'🏆',t:'Master',d:'Score 100 points',u:!1}];

export default function AchievementsPage() {
  const {t,lang}=useI18n(); const router=useRouter();
  const badges=lang==='ru'?BADGES_RU:BADGES_EN;
  return (
    <div style={{minHeight:'100vh',background:'#fef9f4',fontFamily:"'Nunito','Inter',sans-serif"}}>
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span><LangToggle/>
      </div>
      <div style={{maxWidth:500,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark}}>{t('achievements_title')}</h1>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:16}}>
          {badges.map((b,i)=>(
            <div key={i} style={{background:b.u?'white':'#f5f0eb',borderRadius:16,padding:'16px 10px',textAlign:'center',opacity:b.u?1:0.55,boxShadow:b.u?'0 2px 12px rgba(0,0,0,0.06)':'none'}}>
              <div style={{fontSize:'2rem'}}>{b.u?b.e:'🔒'}</div>
              <div style={{fontWeight:700,fontSize:'0.85rem',color:C.dark,marginTop:4}}>{b.t}</div>
              <div style={{fontSize:'0.7rem',color:C.warm,marginTop:2}}>{b.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
