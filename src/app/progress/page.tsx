// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import ThemeToggle from '@/components/ThemeToggle';
import ProgressSummary from '@/components/ProgressSummary';
import ProgressRing from '@/components/ProgressRing';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { SOUND_INFO } from '@/lib/phrases';
import MilaIcon from '@/components/ui/MilaIcon';

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
    {icon:'lesson' as const,l:lang==='ru'?'Уроков':'Lessons',v:data?.completedLessons ?? '…',c:C.jupiter},
    {icon:'target' as const,l:lang==='ru'?'Ср. балл':'Avg score',v:data?(data.avgScore||0):'…',c:C.jupiter},
    {icon:'time' as const,l:lang==='ru'?'Минут':'Minutes',v:minutes ?? '…',c:C.mercury},
    {icon:'streak' as const,l:lang==='ru'?'Дней подряд':'Day streak',v:me?.streakDays ?? '…',c:C.jupiter},
  ];

  const weak = Array.isArray(data?.weakPhonemes) ? data.weakPhonemes.filter((p:any)=>p.attempts>0) : [];
  const recent = Array.isArray(data?.recentLessons) ? data.recentLessons : [];

  return (
    <AppShell className="welcome-page progress-page">
      <AppHeader
        className="progress-page__header"
        title={t('progress_title')}
        actions={<><LangToggle/><ThemeToggle/></>}
      />
      <AppMain width="compact" className="progress-page__main">

        <ProgressSummary items={stats.map(s=>({icon:s.icon,val:s.v,label:s.l,color:s.c}))}/>

        {data && (
          <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:20}}>
            <ProgressRing percent={Math.min(data.avgScore||0,100)} label={lang==='ru'?'Средний балл':'Average score'} color={C.jupiter}/>
            <ProgressRing percent={Math.min((data.completedLessons||0)*10,100)} label={lang==='ru'?'До след. уровня':'To next level'} color={C.mercury}/>
          </div>
        )}

        {/* Weak phonemes — real data from the scoring model */}
        {weak.length > 0 && (
          <div className="welcome-panel" style={{background:C.card,border:`1px solid ${C.line}`,backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'18px 20px',boxShadow:'var(--surface-card-shadow)',marginTop:16}}>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:2}}>
              {lang==='ru'?'Звуки для тренировки':'Sounds to drill'}
            </div>
            <div style={{fontSize:'0.72rem',color:C.warm,marginBottom:12}}>
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
                      <span style={{fontWeight:600,color:C.warm}}> · {p.attempts}× · {lang==='ru'?'освоено':'mastery'} {Math.round((p.mastery||0)*100)}%</span>
                    </div>
                    <div style={{height:5,borderRadius:3,background:'var(--surface-track, rgba(255,255,255,0.10))',marginTop:5}}>
                      <div style={{height:'100%',width:`${Math.round((p.mastery||0)*100)}%`,borderRadius:3,background:C.jupiter,transition:'width .4s'}}/>
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={()=>router.push('/listen')}
              style={{width:'100%',marginTop:8,padding:'11px',borderRadius:12,border:'none',background:C.voiceL,color:C.voice,fontWeight:700,cursor:'pointer',fontSize:'0.88rem',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
              <MilaIcon name="voice" size={17}/>{lang==='ru'?'Тренировать сейчас':'Drill them now'}
            </button>
          </div>
        )}

        {/* Recent lessons — real Progress rows */}
        {recent.length > 0 && (
          <div className="welcome-panel" style={{background:C.card,border:`1px solid ${C.line}`,backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'18px 20px',boxShadow:'var(--surface-card-shadow)',marginTop:16}}>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:12}}>
              {lang==='ru'?'Недавние уроки':'Recent lessons'}
            </div>
            {recent.map((r:any,i:number)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:i<recent.length-1?`1px solid ${C.line}`:'none'}}>
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
            <div style={{width:58,height:58,margin:'0 auto 12px',borderRadius:18,display:'grid',placeItems:'center',color:'var(--mercury-readable, var(--mercury))',background:C.mercuryL,border:`1px solid ${C.line}`}}><MilaIcon name="progress" size={29}/></div>
            <p style={{margin:'0 0 18px',lineHeight:1.6}}>
              {lang==='ru'?'Пока нет данных. Пройди урок или потренируй произношение — статистика появится здесь.':'No data yet. Complete a lesson or practice pronunciation — your stats will grow here.'}
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>router.push('/listen')} style={{padding:'11px 18px',borderRadius:12,border:'none',background:C.voice,color:'#07161a',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:7}}><MilaIcon name="voice" size={17}/>{lang==='ru'?'Произношение':'Pronunciation'}</button>
              <button onClick={()=>router.push('/lessons')} style={{padding:'11px 18px',borderRadius:12,border:'none',background:C.jupiter,color:'#241b05',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:7}}><MilaIcon name="lessons" size={17}/>{lang==='ru'?'Уроки':'Lessons'}</button>
            </div>
          </div>
        )}
      </AppMain>
    </AppShell>
  );
}
