// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import WordCard from '@/components/WordCard';
import WordReviewWidget from '@/components/WordReviewWidget';
import SpacedRepetitionTimer from '@/components/SpacedRepetitionTimer';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { ttsSpeak } from '@/lib/tts';

const WORDS = [
  {en:'hello',ru:'привет',phonetic:'/həˈloʊ/'},{en:'goodbye',ru:'пока',phonetic:'/ɡʊdˈbaɪ/'},
  {en:'please',ru:'пожалуйста',phonetic:'/pliːz/'},{en:'thank you',ru:'спасибо',phonetic:'/θæŋk juː/'},
  {en:'sorry',ru:'извините',phonetic:'/ˈsɒri/'},{en:'yes',ru:'да',phonetic:'/jes/'},
  {en:'no',ru:'нет',phonetic:'/noʊ/'},{en:'maybe',ru:'может быть',phonetic:'/ˈmeɪbi/'},
  {en:'beautiful',ru:'красивый',phonetic:'/ˈbjuːtɪfəl/'},{en:'delicious',ru:'вкусный',phonetic:'/dɪˈlɪʃəs/'},
  {en:'important',ru:'важный',phonetic:'/ɪmˈpɔːrtənt/'},{en:'comfortable',ru:'удобный',phonetic:'/ˈkʌmftəbəl/'},
];

export default function VocabPage() {
  const { t, lang } = useI18n(); const router = useRouter();
  const [idx, setIdx] = useState(0); const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const w = WORDS[idx];

  const speak = async (text: string) => {
    if (playing) return;
    setPlaying(true);
    try {
      await ttsSpeak(text, 'en-US', 0.7);
    } finally {
      setPlaying(false);
    }
  };

  const next = (knew: boolean) => {
    if(knew) setKnown([...known, idx]);
    if(idx < WORDS.length-1) { setIdx(idx+1); setFlipped(false); }
    else setIdx(0);
  };

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      <div style={{background:'rgba(13,16,23,0.72)',backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span>
        <LangToggle/>
      </div>
      <div style={{maxWidth:460,margin:'0 auto',padding:'32px 20px',textAlign:'center'}}>
        <WordCard word={w} flipped={flipped} onFlip={()=>{setFlipped(!flipped);if(!flipped)speak(w.en);}} lang={lang}/>

        <div style={{marginBottom:20}}>
          <SpacedRepetitionTimer repetitionCount={known.includes(idx)?1:0} lang={lang}/>
        </div>

        {/* Listen button */}
        <button onClick={()=>speak(w.en)} disabled={playing}
          style={{padding:'12px 28px',borderRadius:14,border:'none',background:playing?C.rose:C.roseL,
            color:playing?'white':C.rose,fontWeight:600,cursor:playing?'default':'pointer',fontSize:'1rem',marginBottom:20,
            transition:'all 0.2s',opacity:playing?0.7:1}}>
          🔊 {playing ? (lang==='ru'?'Воспроизведение...':'Playing...') : (lang==='ru'?'Прослушать':'Listen')}
        </button>

        <WordReviewWidget known={known.length} total={WORDS.length} lang={lang} onForgot={()=>next(false)} onKnow={()=>next(true)}/>
      </div>
    </div>
  );
}
