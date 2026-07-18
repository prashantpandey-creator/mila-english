'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n-provider';
import MilaIcon from '@/components/ui/MilaIcon';
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
    <div className="lesson-generator">
      <div className="lesson-generator__label">
        <MilaIcon name="sparkle" size={15}/>
        <span>{lang==='ru'?'Урок по твоему запросу':'Made for your moment'}</span>
      </div>
      <Card className="lesson-generator__control" padding="0">
        <input
          type="text"
          placeholder={lang==='ru'?'Закажи урок: «собеседование в IT», «светская беседа»…':'Commission a lesson: “job interview”, “small talk at dinner”…'}
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
          disabled={loading}
          className="lesson-generator__input"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="lesson-generator__button">
          <MilaIcon name="sparkle" size={16}/>{loading ? (lang==='ru'?'Мила пишет…':'Mila is writing…') : (lang==='ru'?'Создать урок':'Commission it')}
        </button>
      </Card>
      {err && (
        <div className="product-feedback is-error">
          {lang==='ru'?'Не получилось — попробуй ещё раз.':'Something failed — try once more.'}
        </div>
      )}
    </div>
  );
}
