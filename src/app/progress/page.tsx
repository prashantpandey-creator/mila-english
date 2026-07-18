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
import { SOUND_INFO } from '@/lib/phrases';
import MilaIcon from '@/components/ui/MilaIcon';

const SIGNAL = '#b63d68';

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
    {icon:'lesson' as const,l:lang==='ru'?'Уроков':'Lessons',v:data?.completedLessons ?? '…',c:SIGNAL},
    {icon:'target' as const,l:lang==='ru'?'Ср. балл':'Avg score',v:data?(data.avgScore||0):'…',c:SIGNAL},
    {icon:'time' as const,l:lang==='ru'?'Минут':'Minutes',v:minutes ?? '…',c:SIGNAL},
    {icon:'streak' as const,l:lang==='ru'?'Дней подряд':'Day streak',v:me?.streakDays ?? '…',c:SIGNAL},
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
        <div className="product-intro">
          <p className="product-intro__kicker">{lang==='ru'?'Твоя история':'Your learning story'}</p>
          <p className="product-intro__copy">{lang==='ru'?'Не гонка и не рейтинг — только полезные сигналы для следующего шага.':'Not a race or a ranking—just useful signals for your next step.'}</p>
        </div>

        <ProgressSummary items={stats.map(s=>({icon:s.icon,val:s.v,label:s.l,color:s.c}))}/>

        {data && (
          <div className="progress-page__rings">
            <ProgressRing percent={Math.min(data.avgScore||0,100)} label={lang==='ru'?'Средний балл':'Average score'} color={SIGNAL}/>
            <ProgressRing percent={Math.min((data.completedLessons||0)*10,100)} label={lang==='ru'?'До след. уровня':'To next level'} color={SIGNAL}/>
          </div>
        )}

        {/* Weak phonemes — real data from the scoring model */}
        {weak.length > 0 && (
          <section className="product-section progress-page__drills">
            <div className="product-section__title">
              {lang==='ru'?'Звуки для тренировки':'Sounds to drill'}
            </div>
            <div className="product-section__copy">
              {lang==='ru'?'По оценкам модели произношения':'From your pronunciation scores'}
            </div>
            {weak.map((p:any)=>{
              const meta = SOUND_INFO[p.phoneme] || {};
              return (
                <div key={p.phoneme} className="sound-row">
                  <span className="sound-row__phoneme">{p.phoneme}</span>
                  <div className="sound-row__copy">
                    <div className="sound-row__title">
                      {meta.ex ? (lang==='ru'?`как в «${meta.ex}»`:`as in “${meta.ex}”`) : (lang==='ru'?'тренируй этот звук':'drill this sound')}
                      <span> · {p.attempts}× · {lang==='ru'?'освоено':'mastery'} {Math.round((p.mastery||0)*100)}%</span>
                    </div>
                    <div className="sound-row__track">
                      <div style={{width:`${Math.round((p.mastery||0)*100)}%`}}/>
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={()=>router.push('/listen')}
              className="product-button product-button--primary product-button--full">
              <MilaIcon name="voice" size={17}/>{lang==='ru'?'Тренировать сейчас':'Drill them now'}
            </button>
          </section>
        )}

        {/* Recent lessons — real Progress rows */}
        {recent.length > 0 && (
          <section className="product-section">
            <div className="product-section__title">
              {lang==='ru'?'Недавние уроки':'Recent lessons'}
            </div>
            {recent.map((r:any,i:number)=>(
              <div key={i} className="recent-lesson">
                <div>
                  <div className="recent-lesson__title">{r.lessonTitle || (lang==='ru'?'Урок':'Lesson')}</div>
                  <div className="recent-lesson__category">{r.category || ''}</div>
                </div>
                <span className="recent-lesson__score">
                  {r.score != null ? r.score : (r.completed ? '✓' : '—')}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Empty state — honest, points at the two learning loops */}
        {data && weak.length===0 && recent.length===0 && (
          <div className="product-empty">
            <div className="product-empty__icon"><MilaIcon name="progress" size={29}/></div>
            <p>
              {lang==='ru'?'Пока нет данных. Пройди урок или потренируй произношение — статистика появится здесь.':'No data yet. Complete a lesson or practice pronunciation — your stats will grow here.'}
            </p>
            <div className="product-actions">
              <button onClick={()=>router.push('/listen')} className="product-button product-button--primary"><MilaIcon name="voice" size={17}/>{lang==='ru'?'Произношение':'Pronunciation'}</button>
              <button onClick={()=>router.push('/lessons')} className="product-button product-button--primary"><MilaIcon name="lessons" size={17}/>{lang==='ru'?'Уроки':'Lessons'}</button>
            </div>
          </div>
        )}
      </AppMain>
    </AppShell>
  );
}
