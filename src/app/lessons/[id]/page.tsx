// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

const C = {rose:'#e91e63',roseL:'#fce4ec',sage:'#5b8c5a',sageL:'#e8f5e9',gold:'#f59e0b',goldL:'#fef3c7',warm:'#78716c',dark:'#44403c'};

const LESSONS = {
  '1':{title:'Знакомство',titleEn:'Introductions',words:['Hello','My name is...','Nice to meet you','Where are you from?','I am from Russia'],
    phrases:[{en:'Hello, how are you?',ru:'Привет, как дела?'},{en:'My name is Anna',ru:'Меня зовут Анна'},
      {en:'Nice to meet you!',ru:'Приятно познакомиться!'},{en:'I am from Moscow',ru:'Я из Москвы'}]},
  '2':{title:'В кафе',titleEn:'At a Café',words:['I would like...','A coffee please','How much is it?','The menu please','Thank you'],
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
    <div style={{minHeight:'100vh',background:'#fef9f4',fontFamily:"'Nunito','Inter',sans-serif"}}>
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
          <div style={{textAlign:'center'}}>
            <div style={{background:'white',borderRadius:20,padding:'32px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.04)',marginBottom:16}}>
              <div style={{fontSize:'2rem',fontWeight:700,color:C.dark,marginBottom:8}}
                   onClick={()=>speak(lesson.words[currentWord])}>
                {lesson.words[currentWord]} 🔊
              </div>
              <div style={{color:C.warm,fontSize:'0.9rem'}}>{currentWord+1} / {lesson.words.length}</div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>setCurrentWord(Math.max(0,currentWord-1))}
                style={{padding:'12px 24px',borderRadius:12,border:'1.5px solid #e5e0dc',background:'white',cursor:'pointer',fontSize:'1.2rem'}}>←</button>
              <button onClick={()=>speak(lesson.words[currentWord])}
                style={{padding:'12px 24px',borderRadius:12,border:'none',background:C.rose,color:'white',cursor:'pointer',fontWeight:600}}>🔊 {lang==='ru'?'Слушать':'Listen'}</button>
              <button onClick={()=>{
                if(currentWord >= lesson.words.length-1) setStep('phrases');
                else setCurrentWord(currentWord+1);
              }}
                style={{padding:'12px 24px',borderRadius:12,border:'1.5px solid #e5e0dc',background:'white',cursor:'pointer',fontSize:'1.2rem'}}>
                {currentWord >= lesson.words.length-1 ? '✅' : '→'}
              </button>
            </div>
          </div>
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
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'3rem',marginBottom:12}}>🎤</div>
            <p style={{color:C.warm,marginBottom:20}}>
              {lang==='ru'?'Произнеси фразу вслух. Не бойся ошибиться — ты учишься!'
                :'Say the phrase aloud. Don\'t worry about mistakes — you\'re learning!'}
            </p>
            {lesson.phrases.map((p,i)=>(
              <div key={i} style={{background:'white',borderRadius:16,padding:'16px',marginBottom:10,boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontWeight:600,fontSize:'1.1rem',color:C.dark,marginBottom:4}}>{p.en}</div>
                <div style={{color:C.warm,fontSize:'0.85rem',marginBottom:8}}>{p.ru}</div>
                <button onClick={()=>speak(p.en)}
                  style={{padding:'8px 18px',borderRadius:20,border:'none',background:C.roseL,color:C.rose,fontWeight:600,cursor:'pointer',fontSize:'0.85rem'}}>
                  🔊 {lang==='ru'?'Послушать':'Listen'}
                </button>
              </div>
            ))}
            <button onClick={()=>router.push('/lessons')}
              style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:C.rose,color:'white',fontWeight:700,fontSize:'1rem',cursor:'pointer',marginTop:12}}>
              {lang==='ru'?'✅ Завершить урок':'✅ Complete lesson'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
