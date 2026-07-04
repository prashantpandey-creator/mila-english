// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function AudioPlayer({ word = 'pronunciation' }: { word?: string }) {
  const speak = () => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US'; u.rate = 0.8;
    speechSynthesis.speak(u);
  };
  return (
    <button onClick={speak} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',borderRadius:14,
      border:'none',background:C.rose,color:'white',fontWeight:600,cursor:'pointer',marginTop:16}}>
      🔊 Listen: {word}
    </button>
  );
}
