// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon from '@/components/ui/MilaIcon';

export default function LessonContent({ words, currentWord, lang, onPrev, onNext, onSpeak }: {
  words: string[]; currentWord: number; lang: 'ru'|'en';
  onPrev: () => void; onNext: () => void; onSpeak: (w: string) => void;
}) {
  const isLast = currentWord >= words.length - 1;
  return (
    <div style={{textAlign:'center'}}>
      <div className="focus-card" style={{padding:'32px 20px',marginBottom:16}}>
        <button type="button" style={{border:0,background:'transparent',display:'inline-flex',alignItems:'center',gap:8,fontSize:'2rem',fontWeight:700,color:C.dark,marginBottom:8,cursor:'pointer'}} onClick={()=>onSpeak(words[currentWord])}>
          {words[currentWord]} <MilaIcon name="volume" size={22}/>
        </button>
        <div style={{color:C.warm,fontSize:'0.9rem'}}>{currentWord+1} / {words.length}</div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'center'}}>
        <button onClick={onPrev}
          aria-label={lang==='ru'?'Предыдущее слово':'Previous word'}
          style={{padding:'12px 24px',borderRadius:12,border:'1px solid var(--surface-control-line)',background:'var(--surface-control)',color:C.warm,cursor:'pointer',fontSize:'1.2rem'}}><MilaIcon name="arrow" size={18} style={{transform:'rotate(180deg)'}}/></button>
        <button onClick={()=>onSpeak(words[currentWord])}
          style={{padding:'12px 24px',borderRadius:12,border:'none',background:C.voice,color:C.white,cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:7}}>
          <MilaIcon name="volume" size={17}/>{lang==='ru'?'Слушать':'Listen'}
        </button>
        <button onClick={onNext}
          style={{padding:'12px 24px',borderRadius:12,border:`1.5px solid ${isLast?C.jupiter:C.mercury}`,background:isLast?C.jupiterL:C.mercuryL,color:isLast?C.jupiter:C.mercury,cursor:'pointer',fontSize:'1.2rem'}}>
          <MilaIcon name={isLast?'practice':'arrow'} size={18}/>
        </button>
      </div>
    </div>
  );
}
