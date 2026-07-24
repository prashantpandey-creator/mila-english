// @ts-nocheck
'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';
import { ttsSpeak } from '@/lib/tts';
import MilaIcon from '@/components/ui/MilaIcon';

export default function SpeechButton({ text = 'Hello! Welcome to FluentMitra.', label }: { text?: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const speak = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      await ttsSpeak(text, 'en-US', 0.85);
    } finally {
      setPlaying(false);
    }
  };
  return (
    <button onClick={speak} disabled={playing}
      style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',
        borderRadius:20,border:`1.5px solid ${C.voice}`,background:C.voiceL,color:'var(--voice-readable,var(--voice))',
        fontWeight:600,fontSize:'0.9rem',cursor:playing?'default':'pointer',opacity:playing?0.7:1}}>
      <MilaIcon name="volume" size={17}/>{playing ? 'Playing…' : (label || 'Hear it')}
    </button>
  );
}
