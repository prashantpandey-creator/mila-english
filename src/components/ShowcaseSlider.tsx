'use client';

// The "hear the accents" showcase — a self-contained warm-paper slider that
// cycles three accents, echoing the landing coach-demo language (sample word,
// IPA, waveform, clarity). Auto-advances, pauses on hover. Lives on the
// dashboard for now; drop <ShowcaseSlider/> anywhere once the landing settles.
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n-provider';

type Slide = {
  kick: string;
  city: string;
  word: string;
  ipa: string;
  clarity: number;
  chips: [string, boolean][];
};

const SLIDES: Slide[] = [
  { kick: 'UK · Received Pronunciation', city: 'London', word: 'comfortable', ipa: '/ˈkʌm.fə.tə.bəl/', clarity: 92, chips: [['com', true], ['fort', false], ['a', true], ['ble', true]] },
  { kick: 'US · General American', city: 'New York', word: 'schedule', ipa: '/ˈskedʒ.uːl/', clarity: 88, chips: [['sche', true], ['du', false], ['le', true]] },
  { kick: 'IN · Indian English', city: 'Mumbai', word: 'particular', ipa: '/pərˈtɪk.jə.lər/', clarity: 95, chips: [['par', true], ['tic', true], ['u', true], ['lar', true]] },
];

// Deterministic waveform heights so SSR and client render identically.
function bars(seed: number): number[] {
  return Array.from({ length: 26 }, (_, i) => 9 + Math.round(27 * Math.abs(Math.sin(seed * 1.7 + i * 0.6))));
}

export default function ShowcaseSlider() {
  const { lang } = useI18n();
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % SLIDES.length);
    }, 4200);
    return () => clearInterval(t);
  }, []);

  const heading = lang === 'ru' ? 'Как Mila слышит акценты' : 'How Mila hears every accent';

  return (
    <section style={{ margin: '28px 0 8px' }}>
      <p style={{ fontFamily: "var(--font-display,'Manrope'),sans-serif", fontWeight: 700, fontSize: '1.05rem', color: 'var(--surface-text)', margin: '0 0 12px' }}>{heading}</p>
      <div
        className="mila-showcase"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        <div className="mila-showcase__grain" aria-hidden />
        <div className="mila-showcase__track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {SLIDES.map((s, i) => (
            <div className="mila-showcase__slide" key={s.city}>
              <div>
                <p className="mila-showcase__kick">{s.kick}</p>
                <h3 className="mila-showcase__city">{s.city}</h3>
                <p className="mila-showcase__word">{s.word}</p>
                <p className="mila-showcase__ipa">{s.ipa}</p>
                <div className="mila-showcase__chips">
                  {s.chips.map(([label, good], k) => (
                    <span key={k} className={`mila-showcase__chip${good ? ' is-good' : ''}`}>{label}</span>
                  ))}
                </div>
                <div className="mila-showcase__wave" aria-hidden>
                  {bars(i + 1).map((h, k) => (<i key={k} style={{ height: h }} />))}
                </div>
              </div>
              <div className="mila-showcase__ring" style={{ ['--p' as string]: `${s.clarity * 3.6}deg` }}>
                <div><b>{s.clarity}</b><span>{lang === 'ru' ? 'чёткость' : 'clarity'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mila-showcase__ctl">
        <div className="mila-showcase__dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.city}
              className={`mila-showcase__dot${i === idx ? ' is-on' : ''}`}
              aria-label={`${s.city} (${i + 1})`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
        <div className="mila-showcase__nav">
          <button aria-label={lang === 'ru' ? 'Назад' : 'Previous'} onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}>‹</button>
          <button aria-label={lang === 'ru' ? 'Вперёд' : 'Next'} onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}>›</button>
        </div>
      </div>
    </section>
  );
}
