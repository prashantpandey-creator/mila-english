// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import LessonContent from '@/components/LessonContent';
import ExercisePlayer from '@/components/ExercisePlayer';
import VisualAidViewer from '@/components/VisualAidViewer';
import { ttsSpeak } from '@/lib/tts';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

const LESSONS = {
  '1':{cat:'🗣️',title:'Знакомство',titleEn:'Introductions',words:['Hello','My name is...','Nice to meet you','Where are you from?','I am from Russia'],
    phrases:[{en:'Hello, how are you?',ru:'Привет, как дела?'},{en:'My name is Anna',ru:'Меня зовут Анна'},
      {en:'Nice to meet you!',ru:'Приятно познакомиться!'},{en:'I am from Moscow',ru:'Я из Москвы'}]},
  '2':{cat:'☕',title:'В кафе',titleEn:'At a Café',words:['I would like...','A coffee please','How much is it?','The menu please','Thank you'],
    phrases:[{en:'I would like a coffee, please',ru:'Я бы хотела кофе, пожалуйста'},
      {en:'How much is it?',ru:'Сколько это стоит?'},{en:'Can I see the menu?',ru:'Можно меню?'}]},
};

export default function LessonPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useParams();
  const staticLesson = LESSONS[params?.id as string];
  const lesson = staticLesson || LESSONS['1'];
  const [currentWord, setCurrentWord] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [step, setStep] = useState<'words'|'phrases'|'practice'>('words');
  const [dbLesson, setDbLesson] = useState<any>(null);
  const [dbError, setDbError] = useState(false);

  // Lessons not in the built-in set are AI-generated ones living in the DB.
  useEffect(() => {
    if (staticLesson) return;
    const timer = setTimeout(() => setDbError(true), 8000); // 8s timeout
    fetch(`/api/lessons/${params?.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { clearTimeout(timer); if (d) setDbLesson(d); else setDbError(true); })
      .catch(() => { clearTimeout(timer); setDbError(true); });
  }, [params?.id, staticLesson]);

  const speak = (text: string) => {
    ttsSpeak(text, 'en-US', 0.75);
  };

  // AI-generated lesson: render its content + exercises directly.
  if (!staticLesson) {
    return (
      <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>
        <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',
          borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span onClick={()=>router.push('/lessons')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>← 🌸 Мила</span>
          <LangToggle />
        </div>
        <div style={{maxWidth:640,margin:'0 auto',padding:'24px 20px'}}>
          {!dbLesson ? (
            <p style={{color:C.warm,textAlign:'center',padding:'40px 0'}}>{t('loading')}</p>
          ) : (
            <>
              <div style={{display:'inline-block',background:C.goldL,color:C.gold,fontWeight:700,fontSize:'0.75rem',padding:'4px 12px',borderRadius:20,marginBottom:12}}>✨ {lang==='ru'?'Урок от ИИ':'AI-generated'}</div>
              <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,margin:'0 0 12px'}}>{dbLesson.title}</h1>
              <div style={{background:'white',borderRadius:16,padding:'20px 24px',boxShadow:'0 1px 8px rgba(0,0,0,0.04)',color:C.dark,lineHeight:1.7,marginBottom:20,whiteSpace:'pre-wrap'}}>
                {dbLesson.content}
              </div>
              {Array.isArray(dbLesson.Exercises) && dbLesson.Exercises.map((ex:any)=>{
                let opts:string[] = [];
                try { opts = typeof ex.options==='string' ? JSON.parse(ex.options) : (ex.options||[]); } catch { opts = []; }
                return (
                  <div key={ex.id} style={{background:'white',borderRadius:16,padding:'16px 20px',boxShadow:'0 1px 8px rgba(0,0,0,0.04)',marginBottom:12}}>
                    <div style={{fontWeight:700,color:C.dark,marginBottom:10}}>{ex.question}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      {opts.map((o,i)=>(
                        <div key={i} style={{padding:'10px',borderRadius:10,border:'1.5px solid #e5e0dc',fontSize:'0.9rem',color:C.dark,textAlign:'center'}}>{o}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button onClick={()=>router.push('/lessons')}
                style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:C.rose,color:'white',fontWeight:700,fontSize:'1rem',cursor:'pointer',marginTop:8}}>
                {lang==='ru'?'← К урокам':'← Back to lessons'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/lessons')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>← 🌸 Мила</span>
        <LangToggle />
      </div>

      <div style={{maxWidth:560,margin:'0 auto',padding:'24px 20px'}}>
        {/* Progress bar */}
        <div style={{display:'flex',gap:4,marginBottom:20}}>
          {['words','phrases','practice'].map((s,i)=>(
            <div key={s} style={{flex:1,height:4,borderRadius:2,background:step===s?C.rose:i<['words','phrases','practice'].indexOf(step)?C.sage:'#e5e0dc',transition:'all 0.3s'}}/>
          ))}
        </div>

        <h1 style={{fontSize:'1.4rem',fontWeight:800,color:C.dark,margin:'0 0 4px'}}>
          {lang==='ru'?lesson.title:lesson.titleEn}
        </h1>
        <p style={{color:C.warm,margin:'0 0 20px'}}>
          {step==='words'?(lang==='ru'?'Выучи слова':'Learn the words'):
           step==='phrases'?(lang==='ru'?'Практикуй фразы':'Practice phrases'):
           lang==='ru'?'Произнеси вслух':'Speak aloud'}
        </p>

        {step === 'words' && (
          <>
            <VisualAidViewer emoji={lesson.cat} title={lang==='ru'?lesson.title:lesson.titleEn}/>
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
              <div key={i} style={{background:'white',borderRadius:16,padding:'16px 20px',marginBottom:10,boxShadow:'0 1px 8px rgba(0,0,0,0.04)',cursor:'pointer'}}
                   onClick={()=>{setShowTranslation(showTranslation===p.en?!showTranslation:p.en);speak(p.en)}}>
                <div style={{fontWeight:600,fontSize:'1.05rem',color:C.dark}}>{p.en}</div>
                {showTranslation===p.en && <div style={{color:C.warm,marginTop:4,fontSize:'0.9rem'}}>{p.ru}</div>}
              </div>
            ))}
            <button onClick={()=>setStep('practice')}
              style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:C.sage,color:'white',fontWeight:700,fontSize:'1rem',cursor:'pointer',marginTop:8}}>
              {lang==='ru'?'Готова говорить! →':'Ready to speak! →'}
            </button>
          </div>
        )}

        {step === 'practice' && (
          <ExercisePlayer
            phrases={lesson.phrases}
            lang={lang}
            onSpeak={speak}
            onComplete={()=>router.push('/lessons')}
          />
        )}
      </div>
    </div>
  );
}
