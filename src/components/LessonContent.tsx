// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function LessonContent({ words, currentWord, lang, onPrev, onNext, onSpeak }: {
  words: string[]; currentWord: number; lang: 'ru'|'en';
  onPrev: () => void; onNext: () => void; onSpeak: (w: string) => void;
}) {
  const isLast = currentWord >= words.length - 1;
  return (
    <div style={{textAlign:'center'}}>
      <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'32px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.45)',marginBottom:16}}>
        <div style={{fontSize:'2rem',fontWeight:700,color:C.dark,marginBottom:8,cursor:'pointer'}}
             onClick={()=>onSpeak(words[currentWord])}>
          {words[currentWord]} 🔊
        </div>
        <div style={{color:C.warm,fontSize:'0.9rem'}}>{currentWord+1} / {words.length}</div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'center'}}>
        <button onClick={onPrev}
          style={{padding:'12px 24px',borderRadius:12,border:'1.5px solid rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',color:C.warm,cursor:'pointer',fontSize:'1.2rem'}}>←</button>
        <button onClick={()=>onSpeak(words[currentWord])}
          style={{padding:'12px 24px',borderRadius:12,border:'none',background:C.voice,color:C.white,cursor:'pointer',fontWeight:600}}>
          🔊 {lang==='ru'?'Слушать':'Listen'}
        </button>
        <button onClick={onNext}
          style={{padding:'12px 24px',borderRadius:12,border:`1.5px solid ${isLast?C.jupiter:C.mercury}`,background:isLast?C.jupiterL:C.mercuryL,backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',color:isLast?C.jupiter:C.mercury,cursor:'pointer',fontSize:'1.2rem'}}>
          {isLast ? '✅' : '→'}
        </button>
      </div>
    </div>
  );
}
