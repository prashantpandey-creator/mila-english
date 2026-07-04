// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function SpeechButton({ text = 'Hello! Welcome to Mila.', label }: { text?: string; label?: string }) {
  const speak = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.85;
    speechSynthesis.speak(u);
  };
  return (
    <button onClick={speak} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',
      borderRadius:20,border:`1.5px solid ${C.rose}`,background:'white',color:C.rose,
      fontWeight:600,fontSize:'0.9rem',cursor:'pointer'}}>
      🔊 {label || 'Hear it'}
    </button>
  );
}
