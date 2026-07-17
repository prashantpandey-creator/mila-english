'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n-provider';
import MilaIcon from '@/components/ui/MilaIcon';
import { C } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

// Commission a lesson from the AI — on success we walk straight into it
// (router.refresh() would not re-run the lessons page's client fetch).
export default function GenerateLessonButton() {
  const { lang } = useI18n();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true); setErr(false);
    try {
      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const d = res.ok ? await res.json() : null;
      if (d?.lessonId) {
        setTopic('');
        router.push(`/lessons/ai-${d.lessonId}`);
      } else setErr(true);
    } catch { setErr(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="lesson-generator" style={{marginBottom:18}}>
      <Card className="lesson-generator__control" padding="14px" style={{display:'flex',gap:10}}>
        <input
          type="text"
          placeholder={lang==='ru'?'Закажи урок: «собеседование в IT», «светская беседа»…':'Commission a lesson: “job interview”, “small talk at dinner”…'}
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
          disabled={loading}
          className="lesson-generator__input"
          style={{flex:1,minWidth:0,padding:'11px 14px',borderRadius:11,border:'1px solid var(--surface-control-line)',
            background:'var(--surface-control)',color:C.dark,fontSize:'0.9rem',outline:'none'}}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="lesson-generator__button"
          style={{padding:'11px 20px',borderRadius:11,border:'none',whiteSpace:'nowrap',
            background:'linear-gradient(135deg,#b54b72,#983556)',color:'#fff',fontWeight:800,fontSize:'0.88rem',
            cursor:(loading||!topic.trim())?'default':'pointer',opacity:(loading||!topic.trim())?0.55:1,
            boxShadow:'0 8px 20px rgba(168,61,100,.2)',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7}}>
          <MilaIcon name="sparkle" size={16}/>{loading ? (lang==='ru'?'Мила пишет…':'Mila is writing…') : (lang==='ru'?'Создать урок':'Commission it')}
        </button>
      </Card>
      {err && (
        <div style={{marginTop:8,fontSize:'0.8rem',color:'#e8556d',textAlign:'center'}}>
          {lang==='ru'?'Не получилось — попробуй ещё раз.':'Something failed — try once more.'}
        </div>
      )}
    </div>
  );
}
