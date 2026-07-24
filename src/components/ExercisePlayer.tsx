// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { C } from '@/lib/theme';
import { ACCENTS, startListening } from '@/lib/speech';
import { ttsSpeak } from '@/lib/tts';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

const VERDICT = {
  good:  { fg: C.venus, bg: C.venusL },
  close: { fg: C.dark, bg: C.card },
  miss:  { fg: C.venusDeep, bg: C.venusL },
};

/** A friendly onboarding card shown only on the first phrase */
function OnboardingGate({ lang, onStart }: { lang: 'ru'|'en'; onStart: () => void }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0,textAlign:'center'}}>
      <div style={{width:64,height:64,display:'grid',placeItems:'center',marginBottom:14,borderRadius:18,color:C.venus,background:C.venusL,border:`1px solid ${C.venus}`}}>
        <MilaIcon name="voice" size={30}/>
      </div>
      <h2 style={{fontSize:'1.4rem',fontWeight:800,color:C.dark,margin:'0 0 8px'}}>
        {lang==='ru' ? 'Задание: произноси вслух!' : 'Speaking Exercise!'}
      </h2>
      <p style={{color:C.warm,fontSize:'0.95rem',lineHeight:1.6,margin:'0 0 24px',maxWidth:340}}>
        {lang==='ru'
          ? 'Сейчас ты будешь слушать фразы и повторять их вслух. ИИ оценит твоё произношение по фонемам — каждый звук отдельно.'
          : 'You\'ll listen to each phrase, then repeat it aloud. Our AI scores every phoneme individually — so you know exactly which sounds to work on.'}
      </p>

      {/* How it works steps */}
      {[
        { icon: 'volume' as MilaIconName, en: 'Tap Listen to hear the phrase', ru: 'Нажми «Послушать», чтобы услышать фразу' },
        { icon: 'voice' as MilaIconName, en: 'Tap the mic and say it clearly', ru: 'Нажми микрофон и произнеси чётко' },
        { icon: 'progress' as MilaIconName, en: 'Get an instant phoneme score', ru: 'Получи оценку за каждый звук' },
        { icon: 'sparkle' as MilaIconName, en: 'Use the feedback, then continue when ready', ru: 'Используй подсказку и продолжай, когда готова' },
      ].map(s => (
        <div className="focus-card" key={s.en} style={{display:'flex',alignItems:'center',gap:12,width:'100%',maxWidth:340,
          padding:'12px 16px',marginBottom:8,textAlign:'left'}}>
          <span style={{width:32,height:32,display:'grid',placeItems:'center',flex:'0 0 auto',borderRadius:9,color:C.venus,background:C.venusL}}><MilaIcon name={s.icon} size={18}/></span>
          <span style={{fontSize:'0.88rem',color:C.dark,fontWeight:500}}>{lang==='ru' ? s.ru : s.en}</span>
        </div>
      ))}

      <div style={{marginTop:8,display:'flex',alignItems:'flex-start',gap:8,background:C.venusL,borderRadius:12,padding:'10px 16px',width:'100%',maxWidth:340,marginBottom:20,color:C.venusDeep,textAlign:'left'}}>
        <MilaIcon name="sparkle" size={16} style={{flex:'0 0 auto',marginTop:1}}/>
        <span style={{fontSize:'0.82rem',fontWeight:600}}>{lang==='ru' ? 'Говори ровно и чётко — модель слышит каждую фонему' : 'Speak clearly and steadily — the model hears every phoneme'}</span>
      </div>

      <button onClick={onStart}
        style={{width:'100%',maxWidth:340,padding:'16px',borderRadius:16,border:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          background:C.venus,color:C.venusInk,fontWeight:800,fontSize:'1.1rem',
          cursor:'pointer',boxShadow:'0 6px 20px rgba(164,0,80,0.24)',letterSpacing:'0.01em'}}>
        {lang==='ru' ? 'Начать упражнение' : 'Start Exercise'} <MilaIcon name="arrow" size={18}/>
      </button>
    </div>
  );
}

export default function ExercisePlayer({ phrases, lang, onSpeak, onComplete }: {
  phrases: { en: string; ru?: string }[]; lang: 'ru'|'en';
  onSpeak: (t: string) => void; onComplete: (score: number) => void;
}) {
  const [showGate, setShowGate] = useState(true);  // onboarding gate
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<'idle'|'speaking'|'recording'|'scoring'|'scored'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errMsg, setErrMsg] = useState('');
  const [session, setSession] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const phrase = phrases[pos] || phrases[0];

  useEffect(() => {
    return () => {
      if (session) { session.stop().catch(() => {}); }
    };
  }, [session]);

  // Auto-listen when moving to a new phrase (after gate closed)
  useEffect(() => {
    if (showGate) return;
    setPhase('idle');
    setResult(null);
    setErrMsg('');
  }, [pos]);

  const onListen = async () => {
    setPhase('speaking');
    try {
      await ttsSpeak(phrase.en, 'en-US', 0.80);
    } finally {
      setPhase((p) => (p === 'speaking' ? 'idle' : p));
    }
  };

  const settle = (r: any) => {
    setScores(previous => {
      const nextScores = [...previous];
      nextScores[pos] = Number(r?.score) || 0;
      return nextScores;
    });
    setResult(r);
    setPhase('scored');
    setSession(null);
    setAttempts(0);
  };

  const fail = (e: any) => {
    const msg = e?.message;
    setAttempts(a => a + 1);
    setErrMsg(
      msg === 'unsupported'
        ? (lang === 'ru' ? 'Микрофон не поддерживается — открой в Chrome.' : 'Speech input needs Chrome — open there to practice.')
        : msg === 'no-speech'
        ? (lang === 'ru' ? 'Микрофон не уловил речь — это не оценка произношения. Нажми кнопку микрофона и начни говорить сразу.' : 'The mic did not capture speech — your pronunciation was not graded. Tap the microphone button and speak right away.')
        : msg === 'score-failed' || msg === 'score-empty'
        ? (lang === 'ru' ? 'Сервис оценки временно недоступен — запись не оценивалась. Попробуй снова.' : 'Scoring is temporarily unavailable — your recording was not graded. Please try again.')
        : (lang === 'ru' ? 'Техническая ошибка микрофона — это не оценка твоей речи. Попробуй снова.' : 'There was a microphone issue — this is not a judgment of your speech. Please try again.')
    );
    setPhase('error');
    setSession(null);
  };

  const onMic = async () => {
    if (phase === 'recording' && session) {
      setPhase('scoring');
      try {
        settle(await session.stop());
      } catch (e) {
        fail(e);
      }
      return;
    }
    setErrMsg('');
    setResult(null);
    setPhase('recording');
    try {
      const s = await startListening(
        phrase.en,
        ACCENTS[1],
        (a) => { setSession(null); settle(a); },
        () => { setPhase('scoring'); setSession(null); },
        (e) => fail(e)
      );
      setSession(s);
    } catch (e) {
      fail(e);
    }
  };

  const next = () => {
    if (pos >= phrases.length - 1) {
      const finalScores = [...scores];
      if (result?.score != null) finalScores[pos] = Number(result.score);
      const average = finalScores.length ? Math.round(finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length) : 0;
      onComplete(average);
    } else {
      setPos(pos + 1);
      setResult(null);
      setPhase('idle');
      setErrMsg('');
      setSession(null);
    }
  };

  const micBusy = phase === 'scoring' || (phase === 'recording' && !session);
  const hasResult = Boolean(result);

  const ring = (score: number) => {
    const r = 24, circ = 2 * Math.PI * r, off = circ - (score / 100) * circ;
    return (
      <svg width="58" height="58" viewBox="0 0 58 58" style={{flex:'0 0 auto'}}>
        <circle cx="29" cy="29" r={r} fill="none" stroke={C.line} strokeWidth="6"/>
        <circle cx="29" cy="29" r={r} fill="none" stroke={C.venus} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 29 29)" style={{transition:'stroke-dashoffset .5s'}}/>
        <text x="29" y="35" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.dark}>{score}</text>
      </svg>
    );
  };

  // ── Onboarding gate (first time only) ──────────────────────────────────────
  if (showGate) {
    return <OnboardingGate lang={lang} onStart={() => setShowGate(false)} />;
  }

  // ── Mic tip after 2+ failed attempts ──────────────────────────────────────
  const showMicTip = attempts >= 2;

  return (
    <div style={{textAlign:'center'}}>
      {/* Progress label + phrase counter */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:'0.72rem',color:C.venus,fontWeight:600,textTransform:'uppercase',letterSpacing:1}}>
          {lang==='ru' ? 'Произношение' : 'Speaking Exercise'}
        </span>
        <span style={{fontSize:'0.72rem',color:C.venusDeep,fontWeight:700,background:C.venusL,borderRadius:20,padding:'2px 10px'}}>
          {pos + 1} / {phrases.length}
        </span>
      </div>

      {/* ── Phrase Card ────────────────────────────────────────────────────── */}
      <div className="focus-card" style={{padding:'24px 20px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:'0.72rem',fontWeight:700,color:C.venus,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>
          <MilaIcon name="target" size={15}/>{lang==='ru' ? 'Повтори эту фразу:' : 'Repeat this phrase:'}
        </div>
        <div style={{fontSize:'1.35rem',fontWeight:700,color:C.dark,lineHeight:1.35,marginBottom:6}}>{phrase.en}</div>
        {phrase.ru ? <div style={{fontSize:'0.9rem',color:C.warm}}>{phrase.ru}</div> : null}
        <button onClick={onListen} disabled={phase==='speaking' || phase==='recording'}
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            width:'100%',marginTop:16,padding:'10px 18px',borderRadius:12,
            background:C.venusL,border:`1px solid ${C.venus}`,
            color:C.venusDeep,fontWeight:700,cursor:(phase==='speaking'||phase==='recording')?'default':'pointer',fontSize:'0.9rem',opacity:(phase==='recording')?0.5:1}}>
          <MilaIcon name="volume" size={17}/>{phase==='speaking' ? (lang==='ru'?'Воспроизведение...':'Playing...') : (lang==='ru'?'Послушать':'Hear it first')}
        </button>
      </div>

      {/* ── Scored Result Card ─────────────────────────────────────────────── */}
      {phase==='scored' && result && (
        <div className="focus-card" style={{padding:'16px 20px',marginBottom:12,textAlign:'left'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            {ring(result.score)}
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:6,fontSize:'0.9rem',fontWeight:700,color:C.dark,marginBottom:6}}>
                <MilaIcon name={result.score >= 80 ? 'trophy' : result.score >= 55 ? 'sparkle' : 'target'} size={17} style={{flex:'0 0 auto',marginTop:1}}/>
                <span>
                {result.score >= 80
                  ? (lang==='ru' ? 'Ясно и уверенно!' : 'Clear and confident!')
                  : result.score >= 55
                  ? (lang==='ru' ? 'Хорошая работа — осталась небольшая доработка.' : 'Good work — one small adjustment.')
                  : (lang==='ru' ? 'Полезная отправная точка — попробуй подсказку или продолжай.' : 'A useful starting point — try the tip or continue.')}
                </span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {result.words.map((w:any,i:number) => (
                  <span key={i} style={{fontSize:'0.78rem',fontWeight:600,color:VERDICT[w.verdict]?.fg || C.dark,background:VERDICT[w.verdict]?.bg || C.card,padding:'2px 8px',borderRadius:6}}>
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {result.words.some((w:any) => w.phonemes?.length) && (
            <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:12}}>
              {result.words.flatMap((w:any) => w.phonemes||[]).map((p:any,i:number) => (
                <span key={i} title={p.acc+'%'} style={{fontSize:'0.72rem',fontWeight:700,fontFamily:'ui-monospace,monospace',
                  color:VERDICT[p.verdict]?.fg || C.dark,background:VERDICT[p.verdict]?.bg || C.card,padding:'2px 6px',borderRadius:5}}>
                  {p.ph}
                </span>
              ))}
            </div>
          )}
          <div style={{marginTop:10,display:'flex',alignItems:'flex-start',gap:7,fontSize:'0.82rem',color:C.warm,lineHeight:1.5,background:C.pageBg,borderRadius:10,padding:'8px 12px'}}>
            <MilaIcon name="sparkle" size={15} style={{flex:'0 0 auto',marginTop:2}}/><span>{result.tip}</span>
          </div>
        </div>
      )}

      {/* ── Error Card ─────────────────────────────────────────────────────── */}
      {phase==='error' && (
        <div style={{background:C.venusL,borderRadius:14,padding:'12px 16px',fontSize:'0.88rem',marginBottom:12,textAlign:'left'}}>
          <div style={{color:C.venusDeep,fontWeight:700,marginBottom:showMicTip?6:0}}>{errMsg}</div>
          {showMicTip && (
            <div style={{display:'flex',alignItems:'flex-start',gap:6,fontSize:'0.8rem',color:C.venusDeep,lineHeight:1.5}}>
              <MilaIcon name="target" size={15} style={{flex:'0 0 auto',marginTop:2}}/>
              <span>
              {lang==='ru'
                ? 'Убедись, что микрофон включён и браузер имеет к нему доступ. Говори сразу после нажатия — не делай паузу.'
                : 'Make sure your mic is allowed in the browser. Speak immediately after tapping — don\'t pause.'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Mic / Action Bar ───────────────────────────────────────────────── */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
        {!hasResult && (
          <>
            <button onClick={onMic} disabled={micBusy}
              style={{width:72,height:72,borderRadius:'50%',border:'none',
                cursor:micBusy?'default':'pointer',
                background: phase==='recording'||phase==='scoring' ? C.venus : C.venusL,
                color:phase==='recording'||phase==='scoring'?C.venusInk:C.venusDeep,fontSize:'1.6rem',
                boxShadow:'0 8px 24px rgba(164,0,80,.24)',
                animation: phase==='recording' ? 'pulse 1.2s ease-in-out infinite' : 'none',
                transition:'background 0.2s'}}>
              {phase==='recording'
                ? <span style={{width:16,height:16,borderRadius:4,background:'currentColor'}} aria-hidden/>
                : <MilaIcon name={phase==='scoring'?'sparkle':'voice'} size={27}/>}
            </button>
            <div style={{fontSize:'0.82rem',fontWeight:600,color:
              phase==='recording'||phase==='scoring' ? C.venus : C.warm,
              lineHeight:1.5,maxWidth:300}}>
              {phase==='recording'
                ? (lang==='ru' ? 'Слушаю... Скажи фразу, потом нажми остановить' : 'Listening… say the phrase, then tap stop')
                : phase==='scoring'
                ? (lang==='ru' ? 'Оцениваю произношение...' : 'Analyzing your pronunciation...')
                : phase==='error'
                ? (lang==='ru' ? 'Попробуй снова' : 'Try again')
                : (lang==='ru' ? 'Нажми и произнеси фразу вслух' : 'Tap to start speaking')}
            </div>
          </>
        )}

        {hasResult && (
          <div style={{display:'flex',gap:10,width:'100%'}}>
            <button onClick={onMic} disabled={micBusy}
              style={{flex:1,padding:'14px',borderRadius:16,border:`1.5px solid ${C.venus}`,background:C.venusL,color:C.venusDeep,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <MilaIcon name="voice" size={17}/>{lang==='ru' ? 'Ещё раз' : 'Try again'}
            </button>
            <button onClick={next}
              style={{flex:2,padding:'16px',borderRadius:16,border:'none',background:C.venus,color:C.venusInk,fontWeight:800,fontSize:'1.05rem',cursor:'pointer',boxShadow:'0 6px 18px rgba(164,0,80,0.24)'}}>
              {pos >= phrases.length - 1 ? (lang==='ru' ? 'Завершить урок' : 'Complete lesson') : (lang==='ru' ? 'Продолжить →' : 'Continue →')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
