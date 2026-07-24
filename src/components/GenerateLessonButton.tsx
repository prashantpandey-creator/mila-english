'use client';

import { useEffect, useState } from 'react';
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
  const [err, setErr] = useState<'generic' | 'pro' | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/users/me', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((user) => {
        if (user && !user.subscription?.isPaid) setErr('pro');
      })
      .catch(() => null)
      .finally(() => setAccessChecked(true));
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const d = await res.json().catch(() => null);
      if (d?.lessonId) {
        setTopic('');
        router.push(`/lessons/ai-${d.lessonId}`);
      } else if (res.status === 402 && d?.code === 'PRO_REQUIRED') setErr('pro');
      else setErr('generic');
    } catch { setErr('generic'); }
    finally { setLoading(false); }
  };

  return (
    <div className="lesson-generator">
      <div className="lesson-generator__label">
        <MilaIcon name="sparkle" size={15}/>
        <span>{lang==='ru'?'Урок по твоему запросу · PRO':'Made for your moment · PRO'}</span>
      </div>
      {accessChecked && err === 'pro' ? (
        <Card className="lesson-generator__upgrade" padding="0">
          <span className="lesson-generator__upgrade-icon"><MilaIcon name="lock" size={20}/></span>
          <span>
            <strong>{lang === 'ru' ? 'Личные уроки входят в FluentMitra Pro' : 'Custom lessons are part of FluentMitra Pro'}</strong>
            <small>{lang === 'ru' ? 'Один доступ на 30 дней, без автопродления.' : 'One 30-day pass, with no automatic renewal.'}</small>
          </span>
          <button type="button" onClick={() => router.push('/pricing')}>{lang === 'ru' ? 'Посмотреть Pro' : 'See FluentMitra Pro'}<MilaIcon name="arrow" size={16}/></button>
        </Card>
      ) : (
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
          <MilaIcon name="sparkle" size={16}/>{loading ? (lang==='ru'?'Создаю урок…':'Creating your lesson…') : (lang==='ru'?'Создать урок':'Commission it')}
        </button>
      </Card>
      )}
      {err === 'generic' && (
        <div className="product-feedback is-error">
          {lang==='ru'?'Не получилось — попробуй ещё раз.':'Something failed — try once more.'}
        </div>
      )}
    </div>
  );
}
