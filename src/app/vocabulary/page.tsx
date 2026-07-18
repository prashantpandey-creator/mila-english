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
        <div className="product-intro product-intro--centered">
          <p className="product-intro__kicker">{lang==='ru'?'Тихое повторение':'Quiet review'}</p>
          <p className="product-intro__copy">{lang==='ru' ? 'Повторения сохраняются для тебя' : 'Your reviews are saved to your profile'}</p>
        </div>
        {status === 'loading' && <p className="product-status">{lang==='ru' ? 'Загружаю слова…' : 'Loading words…'}</p>}
        {status === 'error' && <div className="product-feedback is-error">{lang==='ru' ? 'Не удалось сохранить или загрузить слова. Обнови страницу.' : 'Words could not be loaded or saved. Please refresh.'}</div>}
        {status === 'ready' && !word && <p className="product-status">{lang==='ru' ? 'Слова скоро появятся.' : 'Words are coming soon.'}</p>}
        {status === 'ready' && word && <>
          <WordCard word={{en:word.english,ru:word.translationNative,phonetic:word.phonetic}} flipped={flipped} onFlip={()=>{setFlipped(!flipped);if(!flipped)speak(word.english);}} lang={lang}/>
          <div className="vocabulary-page__timer"><SpacedRepetitionTimer repetitionCount={word.review?.repetitionCount ?? 0} lang={lang}/></div>
          <button onClick={()=>speak(word.english)} disabled={playing} className="product-button product-button--audio vocabulary-page__listen">
            <MilaIcon name="volume" size={17}/>{playing ? (lang==='ru'?'Воспроизведение…':'Playing…') : (lang==='ru'?'Прослушать':'Listen')}
          </button>
          <div className="vocabulary-page__review" data-busy={saving ? 'true' : 'false'}>
            <WordReviewWidget known={known} total={words.length} lang={lang} onForgot={()=>review(false)} onKnow={()=>review(true)}/>
          </div>
        </>}
      </AppMain>
    </AppShell>
  );
}
