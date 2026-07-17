// @ts-nocheck
'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';
import { ttsSpeak } from '@/lib/tts';
import MilaIcon from '@/components/ui/MilaIcon';

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
      <button onClick={speak} disabled={playing} aria-label={`Listen to ${word}`}
        style={{cursor:playing?'default':'pointer',width:size,height:size,borderRadius:'50%',
          border:`1px solid ${playing?C.voice:'rgba(106,220,245,.2)'}`,color:'var(--voice-readable,var(--voice))',
          background:playing?C.voiceL:'rgba(106,220,245,.045)',
          display:'grid',placeItems:'center',margin:'0 auto',padding:0,
          transition:'background 0.2s,border-color .2s,color .2s,box-shadow .2s',opacity:playing?0.78:1,
          boxShadow:playing?'0 0 24px rgba(106,220,245,.2)':'none'}}>
        <MilaIcon name="volume" size={20}/>
      </button>
    </div>
  );
}
