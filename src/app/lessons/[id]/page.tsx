// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import LessonContent from '@/components/LessonContent';
import ExercisePlayer from '@/components/ExercisePlayer';
import VisualAidViewer from '@/components/VisualAidViewer';
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
  const lesson = LESSONS[params?.id as string] || LESSONS['1'];
  const [currentWord, setCurrentWord] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [step, setStep] = useState<'words'|'phrases'|'practice'>('words');

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.75;
    speechSynthesis.speak(u);
  };

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
