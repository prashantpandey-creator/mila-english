// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import DailyLessonCard from '@/components/DailyLessonCard';
import StreakCounter from '@/components/StreakCounter';
import ProgressSummary from '@/components/ProgressSummary';
import PronunciationButton from '@/components/PronunciationButton';
import LeaderboardCard from '@/components/LeaderboardCard';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  useEffect(()=>{setM(true)},[]);
  if (!m) return null;

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>
      {/* Top Bar */}
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(0,0,0,0.04)',position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div onClick={()=>router.push('/')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>
          🌸 Мила
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <LangToggle />
          <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${C.rose},#c2185b)`,
            display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.8rem'}}>
            {lang==='ru'?'А':'A'}
          </div>
        </div>
      </div>

      <div style={{maxWidth:560,margin:'0 auto',padding:'28px 20px'}}>
        {/* Greeting */}
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:'1.6rem',fontWeight:800,margin:0,color:C.dark}}>
            {lang==='ru'?'Доброе утро ☀️':'Good morning ☀️'}
          </h1>
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:6}}>
            <p style={{color:C.warm,margin:0}}>
              {lang==='ru'?'Готова позаниматься?':'Ready to practice?'}
            </p>
            <StreakCounter days={5} lang={lang} />
          </div>
        </div>

        {/* Main CTA — Start Lesson */}
        <DailyLessonCard
          title={lang==='ru'?'Начать урок':'Start Today\'s Lesson'}
          subtitle={lang==='ru'?'Разговор • 5 мин • Лёгкий':'Speaking • 5 min • Easy'}
          onStart={()=>router.push('/lessons')}
        />

        {/* Stats */}
        <div style={{marginBottom:20}}>
          <ProgressSummary items={[
            {emoji:'📝',val:8,label:lang==='ru'?'Слов':'Words',color:C.rose},
            {emoji:'⭐',val:12,label:lang==='ru'?'Уроков':'Lessons',color:C.sage},
          ]}/>
        </div>

        {/* Pronunciation */}
        <div style={{background:'white',borderRadius:20,padding:'20px 24px',boxShadow:'0 1px 8px rgba(0,0,0,0.04)',marginBottom:16,textAlign:'center'}}>
          <div style={{fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:4}}>🎤 {lang==='ru'?'Произношение':'Pronunciation'}</div>
          <p style={{fontSize:'0.85rem',color:C.warm,margin:'0 0 14px'}}>{lang==='ru'?'Нажми и послушай':'Tap to listen'}</p>
          <div style={{display:'flex',justifyContent:'center',gap:20}}>
            {['hello','world','thank you'].map(w=>(
              <PronunciationButton key={w} word={w}/>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {[
            {emoji:'📚',label:lang==='ru'?'Уроки':'Lessons',sub:lang==='ru'?'По темам':'By topic',href:'/lessons',color:C.sage},
            {emoji:'📊',label:lang==='ru'?'Прогресс':'Progress',sub:lang==='ru'?'Статистика':'Stats',href:'/progress',color:C.purple},
            {emoji:'📖',label:lang==='ru'?'Словарь':'Vocabulary',sub:lang==='ru'?'Повторение':'Review',href:'/vocabulary',color:C.gold},
            {emoji:'🏆',label:lang==='ru'?'Успехи':'Badges',sub:lang==='ru'?'Награды':'Achievements',href:'/achievements',color:C.rose},
            {emoji:'🔤',label:lang==='ru'?'Фонетика':'Phonetics',sub:lang==='ru'?'Звуки':'Sounds',href:'/phonetics',color:C.sage},
            {emoji:'🎯',label:lang==='ru'?'Тест':'Assessment',sub:lang==='ru'?'Твой уровень':'Your level',href:'/assessment',color:C.purple},
          ].map((l,i)=>(
            <div key={i} onClick={()=>router.push(l.href)}
              style={{cursor:'pointer',background:'white',borderRadius:16,padding:'16px',boxShadow:'0 1px 8px rgba(0,0,0,0.04)',
                display:'flex',alignItems:'center',gap:12,transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}}>
              <div style={{width:40,height:40,borderRadius:12,background:l.color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>{l.emoji}</div>
              <div><div style={{fontWeight:600,fontSize:'0.95rem',color:C.dark}}>{l.label}</div><div style={{fontSize:'0.8rem',color:C.warm}}>{l.sub}</div></div>
            </div>
          ))}
        </div>

        <LeaderboardCard lang={lang}/>
      </div>
    </div>
  );
}
