// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import LangToggle from '@/components/LangToggle';
import WordCard from '@/components/WordCard';
import WordReviewWidget from '@/components/WordReviewWidget';
import SpacedRepetitionTimer from '@/components/SpacedRepetitionTimer';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { ttsSpeak } from '@/lib/tts';

export default function VocabPage() {
  const { lang } = useI18n();
  const [words, setWords] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');

  useEffect(() => {
    fetch('/api/words').then(async response => {
      if (!response.ok) throw new Error('load');
      const data = await response.json();
      setWords(Array.isArray(data) ? data : []);
      setStatus('ready');
    }).catch(() => setStatus('error'));
  }, []);

  const word = words[idx];
  const known = words.filter(item => (item.review?.repetitionCount ?? 0) > 0).length;

  const speak = async (text: string) => {
    if (playing) return;
    setPlaying(true);
    try { await ttsSpeak(text, 'en-US', 0.7); } finally { setPlaying(false); }
  };

  const review = async (remembered: boolean) => {
    if (!word || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/words/${word.id}/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remembered }),
      });
      if (!response.ok) throw new Error('save');
      const saved = await response.json();
      setWords(current => current.map(item => item.id === word.id ? { ...item, review: saved } : item));
      setIdx(current => (current + 1) % words.length);
      setFlipped(false);
    } catch {
      setStatus('error');
    } finally { setSaving(false); }
  };

  return (
    <AppShell className="welcome-page vocabulary-page">
      <AppHeader
        className="vocabulary-page__header"
        title={lang==='ru' ? 'Новые слова' : 'New words'}
        actions={<LangToggle/>}
      />
      <AppMain width="compact" centered className="vocabulary-page__main">
        <p style={{color:C.warm,margin:'0 0 22px'}}>{lang==='ru' ? 'Повторения сохраняются для тебя' : 'Your reviews are saved to your profile'}</p>
        {status === 'loading' && <p style={{color:C.warm}}>{lang==='ru' ? 'Загружаю слова…' : 'Loading words…'}</p>}
        {status === 'error' && <div style={{color:C.rose,background:C.roseL,padding:14,borderRadius:12}}>{lang==='ru' ? 'Не удалось сохранить или загрузить слова. Обнови страницу.' : 'Words could not be loaded or saved. Please refresh.'}</div>}
        {status === 'ready' && !word && <p style={{color:C.warm}}>{lang==='ru' ? 'Слова скоро появятся.' : 'Words are coming soon.'}</p>}
        {status === 'ready' && word && <>
          <WordCard word={{en:word.english,ru:word.translationNative,phonetic:word.phonetic}} flipped={flipped} onFlip={()=>{setFlipped(!flipped);if(!flipped)speak(word.english);}} lang={lang}/>
          <div style={{marginBottom:20}}><SpacedRepetitionTimer repetitionCount={word.review?.repetitionCount ?? 0} lang={lang}/></div>
          <button onClick={()=>speak(word.english)} disabled={playing} style={{padding:'12px 28px',borderRadius:14,border:`1px solid ${C.voice}`,background:playing?C.voice:C.voiceL,color:playing?'#021418':'var(--voice-readable,var(--voice))',fontWeight:600,cursor:'pointer',fontSize:'1rem',marginBottom:20,display:'inline-flex',alignItems:'center',gap:7}}>
            <MilaIcon name="volume" size={17}/>{playing ? (lang==='ru'?'Воспроизведение…':'Playing…') : (lang==='ru'?'Прослушать':'Listen')}
          </button>
          <div style={{opacity:saving?0.55:1,pointerEvents:saving?'none':'auto'}}>
            <WordReviewWidget known={known} total={words.length} lang={lang} onForgot={()=>review(false)} onKnow={()=>review(true)}/>
          </div>
        </>}
      </AppMain>
    </AppShell>
  );
}
