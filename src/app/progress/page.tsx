// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import ProgressSummary from '@/components/ProgressSummary';
import ProgressRing from '@/components/ProgressRing';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { SOUND_INFO } from '@/lib/phrases';

export default function ProgressPage() {
  const {t,lang}=useI18n(); const router=useRouter();
  const [data,setData]=useState<any>(null);
  const [me,setMe]=useState<any>(null);

  useEffect(()=>{
    fetch('/api/progress').then(r=>r.ok?r.json():null).then(d=>{if(d)setData(d);}).catch(()=>{});
    fetch('/api/users/me').then(r=>r.ok?r.json():null).then(d=>{if(d)setMe(d);}).catch(()=>{});
  },[]);

  const minutes = data ? Math.round(data.totalTimeSeconds/60) : null;
  const stats=[
    {emoji:'⭐',l:lang==='ru'?'Уроков':'Lessons',v:data?.completedLessons ?? '…',c:C.jupiter},
    {emoji:'🎯',l:lang==='ru'?'Ср. балл':'Avg score',v:data?(data.avgScore||0):'…',c:C.jupiter},
    {emoji:'⏱',l:lang==='ru'?'Минут':'Minutes',v:minutes ?? '…',c:C.mercury},
    {emoji:'🔥',l:lang==='ru'?'Дней подряд':'Day streak',v:me?.streakDays ?? '…',c:C.jupiter},
  ];

  const weak = Array.isArray(data?.weakPhonemes) ? data.weakPhonemes.filter((p:any)=>p.attempts>0) : [];
  const recent = Array.isArray(data?.recentLessons) ? data.recentLessons : [];

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      <div style={{background:'rgba(0,0,0,0.84)',backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.3rem',color:C.dark,letterSpacing:'0.03em'}}>Mila</span><LangToggle/>
      </div>
      <div style={{maxWidth:500,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,marginBottom:16}}>{t('progress_title')}</h1>

        <ProgressSummary items={stats.map(s=>({emoji:s.emoji,val:s.v,label:s.l,color:s.c}))}/>

        {data && (
          <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:20}}>
            <ProgressRing percent={Math.min(data.avgScore||0,100)} label={lang==='ru'?'Средний балл':'Average score'} color={C.jupiter}/>
            <ProgressRing percent={Math.min((data.completedLessons||0)*10,100)} label={lang==='ru'?'До след. уровня':'To next level'} color={C.mercury}/>
          </div>
        )}

        {/* Weak phonemes — real data from the scoring model */}
        {weak.length > 0 && (
          <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 12px rgba(0,0,0,0.45)',marginTop:16}}>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:2}}>
              {lang==='ru'?'Звуки для тренировки':'Sounds to drill'}
            </div>
            <div style={{fontSize:'0.72rem',color:'#9d9483',marginBottom:12}}>
              {lang==='ru'?'По оценкам модели произношения':'From your pronunciation scores'}
            </div>
            {weak.map((p:any)=>{
              const meta = SOUND_INFO[p.phoneme] || {};
              return (
                <div key={p.phoneme} style={{display:'flex',alignItems:'center',gap:11,marginBottom:10}}>
                  <span style={{flex:'0 0 auto',minWidth:34,height:34,padding:'0 8px',borderRadius:9,background:C.voiceL,color:C.voice,
                    fontWeight:800,fontFamily:'ui-monospace,monospace',display:'flex',alignItems:'center',justifyContent:'center'}}>{p.phoneme}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.82rem',fontWeight:700,color:C.dark}}>
                      {meta.ex ? (lang==='ru'?`как в «${meta.ex}»`:`as in “${meta.ex}”`) : (lang==='ru'?'тренируй этот звук':'drill this sound')}
                      <span style={{fontWeight:600,color:'#948b7c'}}> · {p.attempts}× · {lang==='ru'?'освоено':'mastery'} {Math.round((p.mastery||0)*100)}%</span>
                    </div>
                    <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.10)',marginTop:5}}>
                      <div style={{height:'100%',width:`${Math.round((p.mastery||0)*100)}%`,borderRadius:3,background:C.jupiter,transition:'width .4s'}}/>
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={()=>router.push('/listen')}
              style={{width:'100%',marginTop:8,padding:'11px',borderRadius:12,border:'none',background:C.voiceL,color:C.voice,fontWeight:700,cursor:'pointer',fontSize:'0.88rem'}}>
              🎙️ {lang==='ru'?'Тренировать сейчас':'Drill them now'}
            </button>
          </div>
        )}

        {/* Recent lessons — real Progress rows */}
        {recent.length > 0 && (
          <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 12px rgba(0,0,0,0.45)',marginTop:16}}>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:12}}>
              {lang==='ru'?'Недавние уроки':'Recent lessons'}
            </div>
            {recent.map((r:any,i:number)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:i<recent.length-1?'1px solid rgba(255,255,255,0.08)':'none'}}>
                <div>
                  <div style={{fontSize:'0.88rem',fontWeight:600,color:C.dark}}>{r.lessonTitle || (lang==='ru'?'Урок':'Lesson')}</div>
                  <div style={{fontSize:'0.72rem',color:C.warm}}>{r.category || ''}</div>
                </div>
                <span style={{fontSize:'0.85rem',fontWeight:800,color:r.score>=55?C.jupiter:C.rose}}>
                  {r.score != null ? r.score : (r.completed ? '✓' : '—')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — honest, points at the two learning loops */}
        {data && weak.length===0 && recent.length===0 && (
          <div style={{textAlign:'center',padding:'36px 12px',color:C.warm}}>
            <div style={{fontSize:'2.6rem',marginBottom:10}}>🌱</div>
            <p style={{margin:'0 0 18px',lineHeight:1.6}}>
              {lang==='ru'?'Пока нет данных. Пройди урок или потренируй произношение — статистика появится здесь.':'No data yet. Complete a lesson or practice pronunciation — your stats will grow here.'}
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>router.push('/listen')} style={{padding:'11px 18px',borderRadius:12,border:'none',background:C.voice,color:C.white,fontWeight:700,cursor:'pointer'}}>🎙️ {lang==='ru'?'Произношение':'Pronunciation'}</button>
              <button onClick={()=>router.push('/lessons')} style={{padding:'11px 18px',borderRadius:12,border:'none',background:C.jupiter,color:C.white,fontWeight:700,cursor:'pointer'}}>📚 {lang==='ru'?'Уроки':'Lessons'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
