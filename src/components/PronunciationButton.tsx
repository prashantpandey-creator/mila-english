// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function PronunciationButton({ word, size = 52 }: { word: string; size?: number }) {
  const speak = () => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US'; u.rate = 0.8;
    speechSynthesis.speak(u);
  };
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontWeight:600,fontSize:'1rem',color:C.dark,marginBottom:6}}>{word}</div>
      <div onClick={speak}
        style={{cursor:'pointer',width:size,height:size,borderRadius:'50%',background:C.roseL,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',margin:'0 auto'}}>
        🔊
      </div>
    </div>
  );
}
