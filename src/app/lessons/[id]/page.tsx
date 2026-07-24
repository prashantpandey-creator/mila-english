// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import LessonContent from '@/components/LessonContent';
import ExercisePlayer from '@/components/ExercisePlayer';
import VisualAidViewer from '@/components/VisualAidViewer';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import { ttsSpeak } from '@/lib/tts';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { getBuiltinLesson } from '@/lib/builtinLessons';
import { teacherForNativeLanguage } from '@/lib/learningMarkets';

function lessonIcon(id: string, category: string): MilaIconName {
  if (id === '1') return 'conversation';
  if (id === '2') return 'cafe';
  if (id === '3') return 'travel';
  if (category === 'Фонетика' || category === 'Phonetics') return 'phonetics';
  if (category === 'Слова' || category === 'Vocabulary') return 'vocabulary';
  if (category === 'Аудирование' || category === 'Listening') return 'listening';
  return 'lesson';
}

// Interactive player for a DB (AI-generated) lesson: content → quiz → recorded result.
function AiLessonPlayer({ lesson, lang, onSpeak, onExit }: any) {
  const [stage, setStage] = useState<'read'|'quiz'|'done'>('read');
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string|null>(null);
  const [verdict, setVerdict] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [points, setPoints] = useState(0);
  const [saved, setSaved] = useState(false);

  const exercises = Array.isArray(lesson.Exercises) ? lesson.Exercises : [];
  const ex = exercises[qi];
  const maxPoints = exercises.reduce((s: number, e: any) => s + (e.points || 10), 0) || 1;

  const optsOf = (e: any): string[] => {
    try { return typeof e.options === 'string' ? JSON.parse(e.options) : (e.options || []); }
    catch { return []; }
  };

  const pick = async (opt: string) => {
    if (picked || checking) return;
    setChecking(true); setPicked(opt);
    try {
      const r = await fetch(`/api/exercises/${ex.id}/check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: opt }),
      });
      const v = r.ok ? await r.json() : null;
      // Offline fallback: compare client-side so the quiz never hard-blocks.
      setVerdict(v || { correct: opt.trim().toLowerCase() === String(ex.correctAnswer).trim().toLowerCase(), correctAnswer: ex.correctAnswer, points: 0 });
      if (v?.correct) setPoints(p => p + (v.points || ex.points || 10));
    } finally { setChecking(false); }
  };

  const nextQ = () => {
    if (qi >= exercises.length - 1) { setStage('done'); return; }
    setQi(qi + 1); setPicked(null); setVerdict(null);
  };

  // Record completion once, when the done screen shows.
  useEffect(() => {
    if (stage !== 'done' || saved) return;
    setSaved(true);
    fetch('/api/progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id, score: Math.round(100 * points / maxPoints), completed: true }),
    }).catch(() => {});
  }, [stage, saved, lesson.id, points, maxPoints]);

  if (stage === 'read') return (
    <>
      <div style={{display:'inline-flex',alignItems:'center',gap:6,background:C.venusL,color:C.venusDeep,fontWeight:700,fontSize:'0.75rem',padding:'4px 12px',borderRadius:20,marginBottom:12}}><MilaIcon name="sparkle" size={14}/>{lang==='ru'?'Урок от ИИ':'AI-generated'}</div>
      <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,margin:'0 0 12px'}}>{lesson.title}</h1>
      <div className="focus-card" style={{padding:'20px 24px',color:C.dark,lineHeight:1.7,marginBottom:16,whiteSpace:'pre-wrap'}}>
        {lesson.content}
      </div>
      <button onClick={()=>onSpeak(lesson.content)}
        style={{width:'100%',padding:'12px',borderRadius:12,border:`1px solid ${C.venus}`,background:C.venusL,color:C.venusDeep,fontWeight:700,cursor:'pointer',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
        <MilaIcon name="volume" size={17}/>{lang==='ru'?'Прослушать урок':'Hear it read aloud'}
      </button>
      <button onClick={()=>exercises.length ? setStage('quiz') : setStage('done')}
        style={{width:'100%',padding:'15px',borderRadius:14,border:'none',background:C.venus,color:C.venusInk,fontWeight:800,fontSize:'1rem',cursor:'pointer'}}>
        {exercises.length ? (lang==='ru'?`Проверить себя (${exercises.length}) →`:`Test yourself (${exercises.length}) →`) : (lang==='ru'?'Завершить':'Finish')}
      </button>
    </>
  );

  if (stage === 'quiz' && ex) {
    const opts = optsOf(ex);
    return (
      <>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontSize:'0.75rem',fontWeight:700,color:C.venus,textTransform:'uppercase',letterSpacing:1}}>{lang==='ru'?'Вопрос':'Question'} {qi+1}/{exercises.length}</span>
          <span style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.75rem',fontWeight:700,color:C.venus}}><MilaIcon name="trophy" size={15}/>{points}</span>
        </div>
        <div className="focus-card" style={{padding:'18px 20px',marginBottom:14}}>
          <div style={{fontWeight:700,color:C.dark,fontSize:'1.05rem'}}>{ex.question}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:8}}>
          {opts.map((o: string, i: number) => {
            const isPick = picked === o;
            const isRight = verdict && o.trim().toLowerCase() === String(verdict.correctAnswer).trim().toLowerCase();
            const bg = !verdict ? C.card : isRight ? C.venusL : C.card;
            const border = !verdict ? C.line : isRight ? C.venus : isPick ? C.venusDeep : C.line;
            return (
              <button key={i} onClick={()=>pick(o)} disabled={!!picked}
                style={{padding:'13px 16px',borderRadius:12,border:`1.5px solid ${border}`,background:bg,
                  fontSize:'0.95rem',color:C.dark,textAlign:'left',cursor:picked?'default':'pointer',fontWeight:isPick||isRight?700:500}}>
                <span style={{display:'flex',alignItems:'center',gap:7}}>
                  {verdict && isRight ? <MilaIcon name="practice" size={17}/> : verdict && isPick && !isRight ? <MilaIcon name="target" size={17}/> : null}{o}
                </span>
              </button>
            );
          })}
        </div>
        {verdict && (
          <>
            {!verdict.correct && verdict.hint && (
              <div style={{marginTop:10,display:'flex',alignItems:'flex-start',gap:7,fontSize:'0.85rem',color:C.venusDeep,background:C.venusL,borderRadius:10,padding:'10px 14px'}}><MilaIcon name="sparkle" size={16} style={{flex:'0 0 auto',marginTop:1}}/><span>{verdict.hint}</span></div>
            )}
            <button onClick={nextQ}
              style={{width:'100%',marginTop:14,padding:'15px',borderRadius:14,border:'none',background:C.venus,color:C.venusInk,fontWeight:800,fontSize:'1rem',cursor:'pointer'}}>
              {qi >= exercises.length-1 ? (lang==='ru'?'Результат →':'See result →') : (lang==='ru'?'Дальше →':'Next →')}
            </button>
          </>
        )}
      </>
    );
  }

  const pct = Math.round(100 * points / maxPoints);
  return (
    <div style={{textAlign:'center',padding:'30px 0'}}>
      <div style={{width:72,height:72,margin:'0 auto 14px',display:'grid',placeItems:'center',borderRadius:20,color:C.venus,background:C.venusL}}><MilaIcon name={pct >= 80 ? 'trophy' : pct >= 50 ? 'sparkle' : 'target'} size={34}/></div>
      <h2 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,margin:'0 0 6px'}}>
        {lang==='ru'?'Урок пройден!':'Lesson complete!'}
      </h2>
      <p style={{color:exercises.length?C.venus:C.warm,marginBottom:20,fontWeight:exercises.length?700:400}}>
        {exercises.length ? `${lang==='ru'?'Счёт':'Score'}: ${points}/${maxPoints} (${pct}%)` : (lang==='ru'?'Материал изучен':'Material studied')}
      </p>
      <button onClick={onExit}
        style={{width:'100%',padding:'15px',borderRadius:14,border:'none',background:C.venus,color:C.venusInk,fontWeight:800,fontSize:'1rem',cursor:'pointer'}}>
        {lang==='ru'?'← К урокам':'← Back to lessons'}
      </button>
    </div>
  );
}

export default function LessonPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useParams();
  const staticLesson = getBuiltinLesson(params?.id as string);
  const lesson = staticLesson ? { ...staticLesson, cat: lessonIcon(staticLesson.id, staticLesson.categoryRu), title: staticLesson.titleRu } : null;
  const [currentWord, setCurrentWord] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [step, setStep] = useState<'words'|'phrases'|'practice'>('words');
  const [dbLesson, setDbLesson] = useState<any>(null);
  const [dbError, setDbError] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const startedAt = useRef(Date.now());

  // Lessons not in the built-in set are AI-generated ones living in the DB,
  // routed as /lessons/ai-<dbId> so they never collide with static ids 1..8.
  useEffect(() => {
    if (staticLesson) return;
    const timer = setTimeout(() => setDbError(true), 8000); // 8s timeout
    fetch(`/api/lessons/${String(params?.id ?? '').replace(/^ai-/, '')}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { clearTimeout(timer); if (d) setDbLesson(d); else setDbError(true); })
      .catch(() => { clearTimeout(timer); setDbError(true); });
  }, [params?.id, staticLesson]);

  useEffect(() => {
    fetch('/api/users/me', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((profile) => setNativeLanguage(profile?.nativeLanguage || ''))
      .catch(() => {});
  }, []);

  const speak = (text: string) => {
    ttsSpeak(text, 'en-US', 0.75);
  };
  const legacyRussianSupport = /^(?:русский|russian)$/iu.test(nativeLanguage);
  const matchedTeacher = teacherForNativeLanguage(nativeLanguage);
  const practicePhrases = (staticLesson?.phrases || []).map((phrase) => ({
    en: phrase.en,
    ru: legacyRussianSupport ? phrase.ru : '',
  }));

  // AI-generated lesson: read the content, then answer the quiz for real —
  // each tap checks against /api/exercises/<id>/check, completion records Progress.
  if (!staticLesson) {
    return (
      <AppShell className="lesson-player lesson-player--generated">
        <AppHeader
          backHref="/lessons"
          title={lang==='ru'?'Личный урок':'Personal lesson'}
          eyebrow={lang==='ru'?'Курс':'Course'}
          actions={<LangToggle />}
        />
        <AppMain width="work" className="lesson-player__main">
          {dbError ? (
            <div style={{textAlign:'center',padding:'40px 0'}}>
              <div style={{width:58,height:58,display:'grid',placeItems:'center',margin:'0 auto 14px',borderRadius:17,color:C.venus,background:C.venusL}}><MilaIcon name="lesson" size={28}/></div>
              <p style={{color:C.warm,marginBottom:16}}>{lang==='ru'?'Урок не нашёлся. Возможно, он ещё генерируется.':'Lesson not found — it may still be generating.'}</p>
              <button onClick={()=>router.push('/lessons')}
                style={{padding:'12px 24px',borderRadius:12,border:'none',background:C.venus,color:C.venusInk,fontWeight:700,cursor:'pointer'}}>
                {lang==='ru'?'← К урокам':'← Back to lessons'}
              </button>
            </div>
          ) : !dbLesson ? (
            <p style={{color:C.warm,textAlign:'center',padding:'40px 0'}}>{t('loading')}</p>
          ) : (
            <AiLessonPlayer lesson={dbLesson} lang={lang} onSpeak={speak} onExit={()=>router.push('/lessons')} />
          )}
        </AppMain>
      </AppShell>
    );
  }

  return (
    <AppShell className="lesson-player lesson-player--builtin">
      <AppHeader
        backHref="/lessons"
        title={lang==='ru'?lesson.title:lesson.titleEn}
        eyebrow={lang==='ru'?'Урок':'Lesson'}
        actions={<LangToggle />}
      />

      <AppMain width="compact" className="lesson-player__main">
        {/* Progress bar */}
        <div style={{display:'flex',gap:4,marginBottom:20}}>
          {['words','phrases','practice'].map((s,i)=>(
            <div key={s} style={{flex:1,height:4,borderRadius:2,background:step === s || i < ['words','phrases','practice'].indexOf(step) ? C.venus : C.line,opacity:step === s ? 1 : i < ['words','phrases','practice'].indexOf(step) ? 0.62 : 1,transition:'all 0.3s'}}/>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
          <h1 style={{fontSize:'1.4rem',fontWeight:800,color:C.dark,margin:'0 0 4px'}}>
            {lang==='ru'?lesson.title:lesson.titleEn}
          </h1>
        </div>
        <p style={{color:C.warm,margin:'0 0 20px'}}>
          {step==='words'?(lang==='ru'?'Выучи слова':'Learn the words'):
           step==='phrases'?(lang==='ru'?'Практикуй фразы':'Practice phrases'):
           lang==='ru'?'Произнеси вслух':'Speak aloud'}
        </p>

        {step === 'words' && (
          <>
            <VisualAidViewer icon={lesson.cat} title={lang==='ru'?lesson.title:lesson.titleEn}/>
            <LessonContent
              words={lesson.words}
              currentWord={currentWord}
              lang={lang}
              onSpeak={speak}
              onPrev={()=>setCurrentWord(Math.max(0,currentWord-1))}
              onNext={()=>{
                if(currentWord >= lesson.words.length-1) setStep('phrases');
                else setCurrentWord(currentWord+1);
              }}
            />
          </>
        )}

        {step === 'phrases' && (
          <div>
            {lesson.phrases.map((p,i)=>(
              <button type="button" className="focus-card" key={i} style={{width:'100%',padding:'16px 20px',marginBottom:10,color:'inherit',font:'inherit',textAlign:'left',cursor:'pointer'}}
                   onClick={()=>{setShowTranslation(showTranslation===p.en?!showTranslation:p.en);speak(p.en)}}>
                <div style={{fontWeight:600,fontSize:'1.05rem',color:C.dark}}>{p.en}</div>
                {showTranslation===p.en && (
                  <div style={{color:C.warm,marginTop:4,fontSize:'0.9rem'}}>
                    {legacyRussianSupport
                      ? p.ru
                      : matchedTeacher
                        ? `${matchedTeacher.name}, your AI English teacher, can explain this in ${nativeLanguage}.`
                        : 'Ask your FluentMitra teacher to explain this phrase in your native language.'}
                  </div>
                )}
              </button>
            ))}
            <button onClick={()=>setStep('practice')}
              style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:C.venus,color:C.venusInk,fontWeight:700,fontSize:'1rem',cursor:'pointer',marginTop:8}}>
              {lang==='ru'?'Готова говорить! →':'Ready to speak! →'}
            </button>
          </div>
        )}

        {step === 'practice' && (
          <ExercisePlayer
            phrases={practicePhrases}
            lang={lang}
            onSpeak={speak}
            onComplete={(score)=>{
              fetch('/api/progress', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ builtinId: staticLesson.id, score, completed: true, timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000) }),
              }).finally(()=>router.push('/lessons'));
            }}
          />
        )}
      </AppMain>
    </AppShell>
  );
}
