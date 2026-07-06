// @ts-nocheck
'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';
import { ttsSpeak } from '@/lib/tts';

export default function AudioPlayer({ word = 'pronunciation' }: { word?: string }) {
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
    <button onClick={speak} disabled={playing}
      style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',borderRadius:14,
        border:'none',background:playing ? '#c2185b' : C.rose,color:'white',fontWeight:600,
        cursor:playing?'default':'pointer',marginTop:16,transition:'background 0.2s'}}>
      🔊 {playing ? 'Playing…' : `Listen: ${word}`}
    </button>
  );
}
