// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function ExercisePlayer({ phrases, lang, onSpeak, onComplete }: {
  phrases: { en: string; ru: string }[]; lang: 'ru'|'en';
  onSpeak: (t: string) => void; onComplete: () => void;
}) {
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:'3rem',marginBottom:12}}>🎤</div>
      <p style={{color:C.warm,marginBottom:20}}>
        {lang==='ru'?'Произнеси фразу вслух. Не бойся ошибиться — ты учишься!'
          :"Say the phrase aloud. Don't worry about mistakes — you're learning!"}
      </p>
      {phrases.map((p,i)=>(
        <div key={i} style={{background:'white',borderRadius:16,padding:'16px',marginBottom:10,boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
          <div style={{fontWeight:600,fontSize:'1.1rem',color:C.dark,marginBottom:4}}>{p.en}</div>
          <div style={{color:C.warm,fontSize:'0.85rem',marginBottom:8}}>{p.ru}</div>
          <button onClick={()=>onSpeak(p.en)}
            style={{padding:'8px 18px',borderRadius:20,border:'none',background:C.roseL,color:C.rose,fontWeight:600,cursor:'pointer',fontSize:'0.85rem'}}>
            🔊 {lang==='ru'?'Послушать':'Listen'}
          </button>
        </div>
      ))}
      <button onClick={onComplete}
        style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:C.rose,color:'white',fontWeight:700,fontSize:'1rem',cursor:'pointer',marginTop:12}}>
        {lang==='ru'?'✅ Завершить урок':'✅ Complete lesson'}
      </button>
    </div>
  );
}
