'use client';

// "How Mila hears every accent" — the first surface built in the design
// language (DESIGN.md): serif for the spoken word, monospace for everything
// measured. Route stops and the VU meter share Mila's single electric signal;
// amplitude and status are expressed through scale, weight, and opacity.
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

type Slide = {
  accent: string;
  line: string;
  word: string;
  ipa: string;
  clarity: number;
  syl: [string, boolean][]; // [label, clean?]
  focus: string;
  tip: string;
  tipRu: string;
};

const SLIDES: Slide[] = [
  { accent: 'Received Pronunciation', line: 'London', word: 'comfortable', ipa: 'ˈkʌm · f · tə · bəl', clarity: 92, syl: [['com', true], ['fort', false], ['a', true], ['ble', true]], focus: '/f/', tip: 'peaking — soften', tipRu: 'на пике — мягче' },
  { accent: 'General American', line: 'New York', word: 'schedule', ipa: 'ˈskedʒ · uːl', clarity: 88, syl: [['sche', true], ['du', false], ['le', true]], focus: '/dʒ/', tip: 'hard — lighten it', tipRu: 'жёстко — легче' },
  { accent: 'Indian English', line: 'Mumbai', word: 'particular', ipa: 'pər · ˈtɪk · jə · lər', clarity: 95, syl: [['par', true], ['tic', true], ['u', true], ['lar', true]], focus: 'clean', tip: 'clean — hold it', tipRu: 'чисто — держи' },
];

// Deterministic VU heights (SSR-stable). A single hue plus opacity keeps the
// meter legible without reintroducing traffic-light colour semantics.
function vu(seed: number): number[] {
  return Array.from({ length: 12 }, (_, i) => 24 + Math.round(74 * Math.abs(Math.sin(seed * 1.3 + i * 0.55))));
}
const vuOpacity = (h: number) => Math.min(1, 0.46 + h / 180);

export default function ShowcaseSlider() {
  const { lang } = useI18n();
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const t = setInterval(() => { if (!paused.current) setIdx((i) => (i + 1) % SLIDES.length); }, 4600);
    return () => clearInterval(t);
  }, []);

  const heading = lang === 'ru' ? 'Практика разных акцентов' : 'Practise across English accents';

  return (
    <section className="mila-showcase-sec">
      <p className="mila-showcase__heading">{heading}</p>
      <div
        className="mila-showcase"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        <div className="mila-showcase__grain" aria-hidden />
        <div className="mila-showcase__track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {SLIDES.map((s, i) => {
            const hub = s.syl.findIndex(([, ok]) => !ok);
            return (
              <div className="mila-showcase__slide" key={s.line}>
                <div className="mila-showcase__top">
                  <span className="mila-showcase__kick">{s.line} · {s.accent} — {s.focus}</span>
                  <span className="mila-showcase__live"><i />{lang === 'ru' ? 'Слушаю' : 'Listening'}</span>
                </div>
                <div className="mila-showcase__word">{s.word}</div>
                <div className="mila-showcase__ipa">{s.ipa}</div>
                <div className="mila-showcase__route">
                  {s.syl.map(([label, ok], k) => (
                    <span key={k} className={`mila-showcase__stop${!ok ? ' is-hub' : ''}${hub >= 0 && k > hub ? ' is-after' : ''}`}>{label}</span>
                  ))}
                </div>
                <div className="mila-showcase__vu">
                  <div className="mila-showcase__vu-graph">
                    <div className="mila-showcase__vu-bars" aria-hidden>
                      {vu(i + 1).map((h, k) => (<i key={k} style={{ height: `${h}%`, background: C.venus, opacity: vuOpacity(h) }} />))}
                    </div>
                    <div className="mila-showcase__vu-cap">
                      <span>−20 vu</span>
                      <span>{s.focus === 'clean' ? (lang === 'ru' ? s.tipRu : s.tip) : `${s.focus} ${lang === 'ru' ? s.tipRu : s.tip}`}</span>
                      <span>+3</span>
                    </div>
                  </div>
                  <div className="mila-showcase__score"><b>{s.clarity}</b><span>{lang === 'ru' ? 'чёткость' : 'clarity'}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mila-showcase__ctl">
        <div className="mila-showcase__dots">
          {SLIDES.map((s, i) => (
            <button key={s.line} className={`mila-showcase__dot${i === idx ? ' is-on' : ''}`} aria-label={`${s.line} (${i + 1})`} onClick={() => setIdx(i)} />
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
