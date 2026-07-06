// @ts-nocheck
'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';
import { ttsSpeak } from '@/lib/tts';

export default function PronunciationButton({ word, size = 52 }: { word: string; size?: number }) {
  const [playing, setPlaying] = useState(false);
  const speak = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      await ttsSpeak(word, 'en-US', 0.8);
    } finally {
      setPlaying(false);
    }
  };
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontWeight:600,fontSize:'1rem',color:C.dark,marginBottom:6}}>{word}</div>
      <div onClick={speak}
        style={{cursor:playing?'default':'pointer',width:size,height:size,borderRadius:'50%',
          background:playing?C.rose:C.roseL,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',margin:'0 auto',
          transition:'background 0.2s',opacity:playing?0.7:1}}>
        {playing ? '🔊' : '🔊'}
      </div>
    </div>
  );
}
