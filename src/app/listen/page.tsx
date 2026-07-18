// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import LangToggle from '@/components/LangToggle';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { ACCENTS, playPhrase, hasRealVoice, startListening, missedSound } from '@/lib/speech';
import { PHRASES, PACKS, SOUND_INFO } from '@/lib/phrases';
import { useScene } from '@/lib/scene';

const SIGNAL = '#c94f5b';
const SIGNAL_SOFT = 'rgba(201,79,91,0.12)';

const VERDICT = {
  good:  { fg: SIGNAL, bg: 'rgba(201,79,91,0.16)' },
  close: { fg: SIGNAL, bg: SIGNAL_SOFT },
  miss:  { fg: SIGNAL, bg: 'rgba(201,79,91,0.07)' },
};

const PACK_ICONS: Record<string, MilaIconName> = {
  airport: 'travel',
  cafe: 'cafe',
  hotel: 'lessons',
  directions: 'target',
  emergencies: 'voice',
};

export default function ListenPage() {
  const { lang } = useI18n();
  const { setScene } = useScene();
  const [m, setM] = useState(false);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [pack, setPack] = useState(PACKS[0].id);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<'idle'|'speaking'|'recording'|'scoring'|'scored'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errMsg, setErrMsg] = useState('');
  const [session, setSession] = useState<any>(null);
  const [soundMisses, setSoundMisses] = useState<Record<string,{count:number;example:string}>>({});
  const [drills, setDrills] = useState<any[]>([]);        // personal AI drills from /api/drill
  const [drillIdx, setDrillIdx] = useState<number|null>(null); // null = pack mode
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => { setM(true); }, []);
  useEffect(() => { if (typeof window !== 'undefined') window.speechSynthesis?.getVoices(); }, [m]);
  // The backdrop follows the room: pick UK → London, US → New York, IN → Mumbai;
  // the situation pack (airport/hotel…) is the softer fallback signal.
  useEffect(() => { setScene({ country: accent.id as any, topic: pack as any }); }, [accent.id, pack]);
  useEffect(() => () => setScene({ country: null, topic: null }), []); // clear on leave
  if (!m) return null;

  // Phrases of the current pack, carrying their global index (= audio file index).
  const items = PHRASES.map((p, i) => ({ ...p, gi: i })).filter((p) => p.pack === pack);
  const inDrill = drillIdx !== null && drills[drillIdx];
  const phrase = inDrill
    ? { text: drills[drillIdx!].text, ipa: drills[drillIdx!].contrast, ru: drills[drillIdx!].tip || '', gi: -1, hard: '', sound: drills[drillIdx!].phoneme }
    : (items[pos] || items[0]);

  const onPack = (id: string) => {
    setPack(id); setPos(0); setResult(null); setPhase('idle'); setErrMsg(''); setSession(null); setDrillIdx(null);
  };

  const onListen = async () => {
    setPhase('speaking');
    await playPhrase(phrase.gi, accent, phrase.text);
    setPhase(p => (p === 'speaking' ? 'idle' : p));
  };

  // Fetch personal drills built from the learner model (weakest phonemes).
  const loadDrills = async () => {
    setDrillLoading(true);
    try {
      const r = await fetch('/api/drill');
      const d = r.ok ? await r.json() : null;
      if (Array.isArray(d?.drills) && d.drills.length) {
        setDrills(d.drills); setDrillIdx(0);
        setResult(null); setPhase('idle'); setErrMsg(''); setSession(null);
      }
    } finally { setDrillLoading(false); }
  };

  // Tally the drilled sound whenever its carrier word wasn't nailed.
  const recordMiss = (ph: any, r: any) => {
    const snd = missedSound(ph, r);
    if (!snd) return;
    setSoundMisses(prev => {
      const cur = prev[snd] || { count: 0, example: ph.hard };
      return { ...prev, [snd]: { count: cur.count + 1, example: ph.hard } };
    });
  };

  const settle = (r: any) => { setResult(r); setPhase('scored'); setSession(null); recordMiss(phrase, r); };
  const fail = (e: any) => {
    const message = e?.message;
    const permissionDenied = e?.name === 'NotAllowedError' || message === 'permission-denied';
    setErrMsg(message === 'unsupported'
      ? (lang==='ru' ? 'Этот браузер не поддерживает запись. Открой Mila в Chrome или Safari.' : 'This browser cannot record audio. Open Mila in Chrome or Safari.')
      : permissionDenied
      ? (lang==='ru' ? 'Нужен доступ к микрофону. Разреши его в настройках браузера — речь пока не оценивалась.' : 'Microphone permission is needed. Allow it in browser settings — your speech was not graded.')
      : message === 'no-speech'
      ? (lang==='ru' ? 'Микрофон не уловил речь — это не оценка произношения. Нажми и начни говорить сразу.' : 'The mic did not capture speech — your pronunciation was not graded. Tap and speak right away.')
      : message === 'score-failed' || message === 'score-empty'
      ? (lang==='ru' ? 'Сервис оценки временно недоступен — запись не оценивалась. Попробуй ещё раз.' : 'Scoring is temporarily unavailable — your recording was not graded. Please try again.')
      : (lang==='ru' ? 'Техническая ошибка микрофона — это не оценка твоей речи. Попробуй снова.' : 'There was a microphone issue — this is not a judgment of your speech. Please try again.'));
    setPhase('error'); setSession(null);
  };

  const onMic = async () => {
    if (phase === 'recording' && session) {
      setPhase('scoring');
      try { settle(await session.stop()); } catch (e) { fail(e); }
      return;
    }
    setErrMsg(''); setResult(null); setPhase('recording');
    try {
      const s = await startListening(
        phrase.text,
        accent,
        (a) => { setSession(null); settle(a); },
        () => { setPhase('scoring'); setSession(null); },
        (e) => fail(e)
      );
      setSession(s);
    } catch (e) { fail(e); }
  };

  const next = () => {
    if (inDrill) {
      setDrillIdx(i => (i! + 1 < drills.length ? i! + 1 : null)); // last drill → back to pack
    } else {
      setPos(i => (i + 1) % items.length);
    }
    setResult(null); setPhase('idle'); setErrMsg(''); setSession(null);
  };
  const micBusy = phase === 'scoring' || (phase === 'recording' && !session);
  const misses = Object.entries(soundMisses).sort((a, b) => b[1].count - a[1].count).slice(0, 4);

  const ring = (score: number) => {
    const r = 26, circ = 2 * Math.PI * r, off = circ - (score / 100) * circ;
    return (
      <svg width="62" height="62" viewBox="0 0 62 62" style={{flex:'0 0 auto'}}>
        <circle cx="31" cy="31" r={r} fill="none" stroke="var(--mila-line, rgba(36,29,25,0.12))" strokeWidth="7"/>
        <circle cx="31" cy="31" r={r} fill="none" stroke={SIGNAL} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 31 31)" style={{transition:'stroke-dashoffset .5s'}}/>
        <text x="31" y="37" textAnchor="middle" fontSize="19" fontWeight="800" fill={C.dark}>{score}</text>
      </svg>
    );
  };

  return (
    <AppShell className="listen-page">
      <AppHeader
        title={lang==='ru' ? 'Тренировка слуха' : 'Listening studio'}
        eyebrow={lang==='ru' ? 'Слушай и повторяй' : 'Listen & repeat'}
        actions={
          <>
            <span className="app-header__badge">B1</span>
            <LangToggle/>
          </>
        }
      />

      <AppMain width="compact" className="listen-page__main">
        <section className="focus-field" aria-labelledby="listen-situation-label">
          <div id="listen-situation-label" className="focus-field__label">
            {lang==='ru'?'Ситуация':'Situation'}
          </div>
          <div className="focus-chip-strip">
            {PACKS.map(p=>(
              <button key={p.id} onClick={()=>onPack(p.id)}
                className={`focus-chip focus-chip--voice ${pack===p.id ? 'is-active' : ''}`}
                aria-pressed={pack===p.id}>
                <MilaIcon name={PACK_ICONS[p.id]} size={15}/>{lang==='ru'?p.ru:p.en}
              </button>
            ))}
          </div>
        </section>

        <section className="focus-field" aria-labelledby="listen-accent-label">
          <div id="listen-accent-label" className="focus-field__label">
            {lang==='ru'?'Акцент':'Accent'}
          </div>
          <div className="focus-chip-strip">
            {ACCENTS.map(a=>(
              <button key={a.id} onClick={()=>setAccent(a)}
                className={`focus-chip focus-chip--voice ${accent.id===a.id ? 'is-active' : ''}`}
                aria-pressed={accent.id===a.id}>
                {a.flag} {a.label}
              </button>
            ))}
          </div>
        </section>

        {/* phrase card */}
        <section className={`focus-card listen-page__phrase ${inDrill ? 'is-drill' : ''}`}>
          <div className={`listen-page__phrase-meta ${inDrill ? 'is-drill' : ''}`}>
            {inDrill && <MilaIcon name="target" size={14}/>}<span>{inDrill
              ? `${lang==='ru'?'Персональная тренировка':'Personal drill'} · ${drillIdx!+1}/${drills.length} · /${phrase.sound}/`
              : `${lang==='ru'?'Слушай и повтори':'Listen & repeat'} · ${pos+1}/${items.length}`}</span>
          </div>
          <div className="listen-page__phrase-text">{phrase.text}</div>
          <div className="listen-page__ipa">{phrase.ipa}</div>
          <button onClick={onListen} disabled={phase==='speaking'}
            className="listen-page__hear">
            <MilaIcon name="volume" size={17}/>{phase==='speaking' ? (lang==='ru'?'Звучит…':'Playing…') : `${lang==='ru'?'Прослушать':'Hear it'} — ${accent.flag} ${accent.label}`}
          </button>
          <div className="listen-page__voice-note">
            {hasRealVoice(accent) && <MilaIcon name="sparkle" size={13}/>}<span>{hasRealVoice(accent)
              ? (lang==='ru'?'Настоящий голос носителя':'Real native voice')
              : (lang==='ru'?'Синтетический голос — настоящий акцент скоро':'Synthetic for now — real accent coming')}
            </span>
          </div>
        </section>

        {/* score / result */}
        {phase==='scored' && result && (
          <section className="focus-card listen-page__result" aria-live="polite">
            <div className="listen-page__result-head">
              {ring(result.score)}
              <div className="listen-page__result-copy">
                <div className="listen-page__result-title">
                  {result.score>=80?(lang==='ru'?'Ясно и уверенно':'Clear and confident'):result.score>=55?(lang==='ru'?'Хорошая работа — одна небольшая доработка':'Good work — one small adjustment'):(lang==='ru'?'Полезная отправная точка — попробуй подсказку':'A useful starting point — try the tip')}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {result.words.map((w:any,i:number)=>(
                    <span key={i} style={{fontSize:'0.78rem',fontWeight:600,color:VERDICT[w.verdict].fg,background:VERDICT[w.verdict].bg,padding:'2px 7px',borderRadius:6}}>{w.word}</span>
                  ))}
                </div>
              </div>
            </div>
            {result.words.some((w:any)=>w.phonemes?.length) && (
              <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:12}}>
                {result.words.flatMap((w:any)=>w.phonemes||[]).map((p:any,i:number)=>(
                  <span key={i} title={p.acc+'%'} style={{fontSize:'0.72rem',fontWeight:700,fontFamily:'ui-monospace,monospace',
                    color:VERDICT[p.verdict].fg,background:VERDICT[p.verdict].bg,padding:'2px 6px',borderRadius:5}}>{p.ph}</span>
                ))}
              </div>
            )}
            <div className="listen-page__tip">
              <MilaIcon name="sparkle" size={15}/><span>{result.tip}</span>
            </div>
            <div style={{marginTop:8,fontSize:'0.8rem',color:'var(--mila-muted, #746861)'}}>{phrase.ru}</div>
          </section>
        )}

        {phase==='error' && (
          <div className="focus-error" role="alert">{errMsg}</div>
        )}

        {/* mic + next */}
        <div className="listen-page__controls">
          <button onClick={next}
            className="focus-button focus-button--voice">
            {lang==='ru'?'Следующая →':'Next phrase →'}
          </button>
          <button onClick={onMic} disabled={micBusy}
            aria-label={phase==='recording'?(lang==='ru'?'Остановить':'Stop'):(lang==='ru'?'Произнести':'Say it back')}
            className={`listen-page__mic ${phase==='recording' ? 'is-recording' : ''} ${phase==='scoring' ? 'is-scoring' : ''}`}>
            {phase==='recording' ? <span className="listen-page__stop" aria-hidden/> : <MilaIcon name={phase==='scoring'?'sparkle':'voice'} size={24}/>}
          </button>
        </div>
        <div className="listen-page__mic-status" style={{
          color:phase==='recording'||phase==='scoring'?SIGNAL:'var(--mila-muted, #746861)',
          fontWeight:(phase==='recording'||phase==='scoring')?700:400}} aria-live="polite">
          {phase==='recording'
            ? (lang==='ru'?'Слушаю… говори, потом нажми остановить':'Listening… speak, then tap stop')
            : phase==='scoring'
            ? (lang==='ru'?'Оцениваю на устройстве…':'Scoring on your device…')
            : (lang==='ru'?'Нажми и произнеси вслух':'Tap the mic and say it aloud')}
        </div>

        {/* weak-sound recap — grows as the session goes */}
        {misses.length > 0 && (
          <section className="focus-card listen-page__recap">
            <div className="listen-page__recap-title">
              {lang==='ru'?'Звуки для тренировки':'Sounds to drill'}
            </div>
            <div className="listen-page__recap-copy">
              {lang==='ru'?'Где ты чаще спотыкаешься':'Where you keep stumbling'}
            </div>
            {misses.map(([snd, info]) => {
              const meta = SOUND_INFO[snd] || { ex: info.example, en: '', ru: '' };
              return (
                <div key={snd} style={{display:'flex',alignItems:'flex-start',gap:11,marginBottom:11}}>
                  <span style={{flex:'0 0 auto',minWidth:34,height:34,padding:'0 8px',borderRadius:9,background:SIGNAL_SOFT,color:SIGNAL,
                    fontWeight:800,fontSize:'0.95rem',fontFamily:'ui-monospace,monospace',display:'flex',alignItems:'center',justifyContent:'center'}}>{snd}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.82rem',fontWeight:700,color:C.dark}}>
                      {lang==='ru'?`как в «${meta.ex}»`:`as in “${meta.ex}”`}
                      <span style={{fontWeight:600,color:'var(--mila-muted, #746861)'}}> · {info.count}×</span>
                    </div>
                    <div style={{fontSize:'0.76rem',color:C.warm,lineHeight:1.4,marginTop:1}}>{lang==='ru'?meta.ru:meta.en}</div>
                  </div>
                </div>
              );
            })}
            <button onClick={loadDrills} disabled={drillLoading}
              className="focus-button focus-button--voice">
              <MilaIcon name="sparkle" size={16}/>
              {drillLoading
                ? (lang==='ru'?'Мила готовит упражнения…':'Mila is building your drills…')
                : (lang==='ru'?'Тренировка на мои слабые звуки':'Drills for my weak sounds')}
            </button>
          </section>
        )}

        <div className="listen-page__footnote">
          <MilaIcon name="target" size={14}/><span>{lang==='ru'
            ? 'Оценка по фонемам — модель на нашем сервере, мгновенно.'
            : 'Phoneme-level scoring by our model — instant.'}</span>
        </div>
      </AppMain>
    </AppShell>
  );
}
