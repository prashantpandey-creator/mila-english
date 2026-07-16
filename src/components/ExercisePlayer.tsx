// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { C } from '@/lib/theme';
import { ACCENTS, startListening } from '@/lib/speech';
import { ttsSpeak } from '@/lib/tts';

const VERDICT = {
  good:  { fg: '#8fce84', bg: 'rgba(143,206,132,0.16)' },
  close: { fg: '#e0b64e', bg: 'rgba(212,175,55,0.18)' },
  miss:  { fg: '#e8556d', bg: 'rgba(232,85,109,0.16)' },
};

/** A friendly onboarding card shown only on the first phrase */
function OnboardingGate({ lang, onStart }: { lang: 'ru'|'en'; onStart: () => void }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0,textAlign:'center'}}>
      <div style={{fontSize:'3.5rem',marginBottom:12}}>🎙️</div>
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
        { icon: '🔊', en: 'Tap Listen to hear the phrase', ru: 'Нажми «Послушать», чтобы услышать фразу' },
        { icon: '🎙️', en: 'Tap the mic and say it clearly', ru: 'Нажми микрофон и произнеси чётко' },
        { icon: '📊', en: 'Get an instant phoneme score', ru: 'Получи оценку за каждый звук' },
        { icon: '🌱', en: 'Use the feedback, then continue when ready', ru: 'Используй подсказку и продолжай, когда готова' },
      ].map(s => (
        <div key={s.en} style={{display:'flex',alignItems:'center',gap:12,width:'100%',maxWidth:340,
          background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:14,padding:'12px 16px',marginBottom:8,boxShadow:'0 1px 8px rgba(0,0,0,0.45)',textAlign:'left'}}>
          <span style={{fontSize:'1.4rem',flex:'0 0 auto'}}>{s.icon}</span>
          <span style={{fontSize:'0.88rem',color:C.dark,fontWeight:500}}>{lang==='ru' ? s.ru : s.en}</span>
        </div>
      ))}

      <div style={{marginTop:8,background:'rgba(167,139,250,0.16)',borderRadius:12,padding:'10px 16px',width:'100%',maxWidth:340,marginBottom:20}}>
        <span style={{fontSize:'0.82rem',color:'#a78bfa',fontWeight:600}}>
          💡 {lang==='ru' ? 'Говори ровно и чётко — модель слышит каждую фонему' : 'Speak clearly and steadily — the model hears every phoneme'}
        </span>
      </div>

      <button onClick={onStart}
        style={{width:'100%',maxWidth:340,padding:'16px',borderRadius:16,border:'none',
          background:`linear-gradient(135deg,${C.rose},#e8556d)`,color:'white',fontWeight:800,fontSize:'1.1rem',
          cursor:'pointer',boxShadow:'0 6px 20px rgba(233,30,99,0.3)',letterSpacing:'0.01em'}}>
        {lang==='ru' ? '🚀 Начать упражнение' : '🚀 Start Exercise'}
      </button>
    </div>
  );
}

export default function ExercisePlayer({ phrases, lang, onSpeak, onComplete }: {
  phrases: { en: string; ru: string }[]; lang: 'ru'|'en';
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
        ? (lang === 'ru' ? 'Микрофон не уловил речь — это не оценка произношения. Нажми 🎙️ и начни говорить сразу.' : 'The mic did not capture speech — your pronunciation was not graded. Tap 🎙️ and speak right away.')
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
    const col = score >= 80 ? C.sage : score >= 55 ? C.gold : C.rose;
    return (
      <svg width="58" height="58" viewBox="0 0 58 58" style={{flex:'0 0 auto'}}>
        <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6"/>
        <circle cx="29" cy="29" r={r} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"
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
        <span style={{fontSize:'0.72rem',color:'#9d9483',fontWeight:600,textTransform:'uppercase',letterSpacing:1}}>
          {lang==='ru' ? 'Произношение' : 'Speaking Exercise'}
        </span>
        <span style={{fontSize:'0.72rem',color:'#9d9483',fontWeight:700,background:'rgba(255,255,255,0.08)',borderRadius:20,padding:'2px 10px'}}>
          {pos + 1} / {phrases.length}
        </span>
      </div>

      {/* ── Phrase Card ────────────────────────────────────────────────────── */}
      <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'24px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.45)',marginBottom:12}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,color:C.purple,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>
          🎯 {lang==='ru' ? 'Повтори эту фразу:' : 'Repeat this phrase:'}
        </div>
        <div style={{fontSize:'1.35rem',fontWeight:700,color:C.dark,lineHeight:1.35,marginBottom:6}}>{phrase.en}</div>
        <div style={{fontSize:'0.9rem',color:C.warm}}>{phrase.ru}</div>
        <button onClick={onListen} disabled={phase==='speaking' || phase==='recording'}
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            width:'100%',marginTop:16,padding:'10px 18px',borderRadius:12,border:'none',
            background: phase==='speaking' ? C.roseL : 'rgba(232,85,109,0.16)',
            color:C.rose,fontWeight:700,cursor:(phase==='speaking'||phase==='recording')?'default':'pointer',fontSize:'0.9rem',opacity:(phase==='recording')?0.5:1}}>
          🔊 {phase==='speaking' ? (lang==='ru'?'Воспроизведение...':'Playing...') : (lang==='ru'?'Послушать':'Hear it first')}
        </button>
      </div>

      {/* ── Scored Result Card ─────────────────────────────────────────────── */}
      {phase==='scored' && result && (
        <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'16px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.45)',marginBottom:12,textAlign:'left'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            {ring(result.score)}
            <div style={{flex:1}}>
              <div style={{fontSize:'0.9rem',fontWeight:700,color:C.dark,marginBottom:6}}>
                {result.score >= 80
                  ? (lang==='ru' ? '🌟 Ясно и уверенно!' : '🌟 Clear and confident!')
                  : result.score >= 55
                  ? (lang==='ru' ? '✨ Хорошая работа — осталась небольшая доработка.' : '✨ Good work — one small adjustment.')
                  : (lang==='ru' ? '🌱 Полезная отправная точка — попробуй подсказку или продолжай.' : '🌱 A useful starting point — try the tip or continue.')}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {result.words.map((w:any,i:number) => (
                  <span key={i} style={{fontSize:'0.78rem',fontWeight:600,color:VERDICT[w.verdict]?.fg || C.dark,background:VERDICT[w.verdict]?.bg || 'rgba(255,255,255,0.08)',padding:'2px 8px',borderRadius:6}}>
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
                  color:VERDICT[p.verdict]?.fg || C.dark,background:VERDICT[p.verdict]?.bg || 'rgba(255,255,255,0.08)',padding:'2px 6px',borderRadius:5}}>
                  {p.ph}
                </span>
              ))}
            </div>
          )}
          <div style={{marginTop:10,fontSize:'0.82rem',color:C.warm,lineHeight:1.5,background:C.pageBg,borderRadius:10,padding:'8px 12px'}}>
            💡 {result.tip}
          </div>
        </div>
      )}

      {/* ── Error Card ─────────────────────────────────────────────────────── */}
      {phase==='error' && (
        <div style={{background:C.roseL,borderRadius:14,padding:'12px 16px',fontSize:'0.88rem',marginBottom:12,textAlign:'left'}}>
          <div style={{color:C.rose,fontWeight:700,marginBottom:showMicTip?6:0}}>{errMsg}</div>
          {showMicTip && (
            <div style={{fontSize:'0.8rem',color:'#c0392b',lineHeight:1.5}}>
              {lang==='ru'
                ? '📌 Убедись, что микрофон включён и браузер имеет к нему доступ. Говори сразу после нажатия — не делай паузу.'
                : '📌 Make sure your mic is allowed in the browser. Speak immediately after tapping — don\'t pause.'}
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
                background: phase==='recording' ? C.gold : phase==='scoring' ? '#a78bfa' : C.rose,
                color:'white',fontSize:'1.6rem',
                boxShadow:`0 8px 24px ${phase==='recording'?'rgba(212,175,55,.45)':phase==='scoring'?'rgba(124,58,237,.35)':'rgba(233,30,99,.35)'}`,
                animation: phase==='recording' ? 'pulse 1.2s ease-in-out infinite' : 'none',
                transition:'background 0.2s'}}>
              {phase==='recording' ? '⏹' : phase==='scoring' ? '⏳' : '🎙️'}
            </button>
            <div style={{fontSize:'0.82rem',fontWeight:600,color:
              phase==='recording' ? C.gold : phase==='scoring' ? '#a78bfa' : C.warm,
              lineHeight:1.5,maxWidth:300}}>
              {phase==='recording'
                ? (lang==='ru' ? '🔴 Слушаю... Скажи фразу, потом нажми ⏹' : '🔴 Listening… say the phrase, then tap ⏹ to stop')
                : phase==='scoring'
                ? (lang==='ru' ? '⏳ Оцениваю произношение...' : '⏳ Analyzing your pronunciation...')
                : phase==='error'
                ? (lang==='ru' ? 'Попробуй снова 👇' : 'Try again 👇')
                : (lang==='ru' ? 'Нажми и произнеси фразу вслух' : 'Tap to start speaking')}
            </div>
          </>
        )}

        {hasResult && (
          <div style={{display:'flex',gap:10,width:'100%'}}>
            <button onClick={onMic} disabled={micBusy}
              style={{flex:1,padding:'14px',borderRadius:16,border:'1.5px solid rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.05)',color:C.warm,fontWeight:700,cursor:'pointer'}}>
              🎙️ {lang==='ru' ? 'Ещё раз' : 'Try again'}
            </button>
            <button onClick={next}
              style={{flex:2,padding:'16px',borderRadius:16,border:'none',background:`linear-gradient(135deg,${C.sage},#8fce84)`,color:'white',fontWeight:800,fontSize:'1.05rem',cursor:'pointer',boxShadow:'0 6px 18px rgba(91,140,90,0.3)'}}>
              {pos >= phrases.length - 1 ? (lang==='ru' ? 'Завершить урок' : 'Complete lesson') : (lang==='ru' ? 'Продолжить →' : 'Continue →')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
