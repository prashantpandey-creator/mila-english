// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { C } from '@/lib/theme';
import { ACCENTS, startListening } from '@/lib/speech';

const VERDICT = {
  good:  { fg: '#3f7a3e', bg: '#e8f5e9' },
  close: { fg: '#b45309', bg: '#fef3c7' },
  miss:  { fg: '#e91e63', bg: '#fce4ec' },
};

export default function ExercisePlayer({ phrases, lang, onSpeak, onComplete }: {
  phrases: { en: string; ru: string }[]; lang: 'ru'|'en';
  onSpeak: (t: string) => void; onComplete: () => void;
}) {
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<'idle'|'speaking'|'recording'|'scoring'|'scored'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errMsg, setErrMsg] = useState('');
  const [session, setSession] = useState<any>(null);

  const phrase = phrases[pos] || phrases[0];

  useEffect(() => {
    return () => {
      if (session) {
        session.stop().catch(() => {});
      }
    };
  }, [session]);

  const onListen = async () => {
    setPhase('speaking');
    onSpeak(phrase.en);
    setTimeout(() => {
      setPhase('idle');
    }, 1200);
  };

  const settle = (r: any) => {
    setResult(r);
    setPhase('scored');
    setSession(null);
  };

  const fail = (e: any) => {
    setErrMsg(lang === 'ru'
      ? 'Не расслышала. Попробуй ещё раз.'
      : "Didn't catch that. Try again.");
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
        (a) => {
          setSession(null);
          settle(a);
        },
        () => {
          setPhase('scoring');
          setSession(null);
        }
      );
      setSession(s);
    } catch (e) {
      fail(e);
    }
  };

  const next = () => {
    if (pos >= phrases.length - 1) {
      onComplete();
    } else {
      setPos(pos + 1);
      setResult(null);
      setPhase('idle');
      setErrMsg('');
      setSession(null);
    }
  };

  const micBusy = phase === 'scoring' || (phase === 'recording' && !session);
  const isPassed = result && result.score >= 55;

  const ring = (score: number) => {
    const r = 24, circ = 2 * Math.PI * r, off = circ - (score / 100) * circ;
    const col = score >= 55 ? C.sage : C.rose;
    return (
      <svg width="58" height="58" viewBox="0 0 58 58" style={{flex:'0 0 auto'}}>
        <circle cx="29" cy="29" r={r} fill="none" stroke="#f0ece7" strokeWidth="6"/>
        <circle cx="29" cy="29" r={r} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 29 29)" style={{transition:'stroke-dashoffset .5s'}}/>
        <text x="29" y="35" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.dark}>{score}</text>
      </svg>
    );
  };

  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:'3rem',marginBottom:12}}>🎙️</div>
      <p style={{color:C.warm,marginBottom:20}}>
        {lang==='ru'
          ? 'Прослушай фразу, а затем произнеси её в микрофон.'
          : 'Listen to the phrase, then say it into the mic.'}
      </p>

      {/* Progress label */}
      <div style={{fontSize:'0.75rem',color:'#a8a29e',fontWeight:600,marginBottom:10}}>
        {lang==='ru'?'Фраза':'Phrase'} {pos + 1} / {phrases.length}
      </div>

      {/* Active Phrase Card */}
      <div style={{background:'white',borderRadius:20,padding:'24px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.04)',marginBottom:16}}>
        <div style={{fontSize:'1.3rem',fontWeight:700,color:C.dark,lineHeight:1.3,marginBottom:6}}>{phrase.en}</div>
        <div style={{fontSize:'0.9rem',color:C.warm}}>{phrase.ru}</div>

        <button onClick={onListen} disabled={phase==='speaking' || phase==='recording'}
          style={{marginTop:16,padding:'8px 18px',borderRadius:20,border:'none',background:C.roseL,color:C.rose,fontWeight:600,cursor:'pointer',fontSize:'0.85rem'}}>
          🔊 {phase==='speaking' ? (lang==='ru'?'Воспроизведение...':'Playing...') : (lang==='ru'?'Послушать':'Listen')}
        </button>
      </div>

      {/* Scored Result Card */}
      {phase==='scored' && result && (
        <div style={{background:'white',borderRadius:20,padding:'16px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.04)',marginBottom:16,textAlign:'left'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            {ring(result.score)}
            <div style={{flex:1}}>
              <div style={{fontSize:'0.9rem',fontWeight:700,color:C.dark,marginBottom:6}}>
                {isPassed
                  ? (lang==='ru'?'Отлично! Проходной балл набран.':'Excellent! Passing score achieved.')
                  : (lang==='ru'?'Слабовато. Попробуй произнести чётче!':'Needs work. Try speaking more clearly!')}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {result.words.map((w:any,i:number)=>(
                  <span key={i} style={{fontSize:'0.75rem',fontWeight:600,color:VERDICT[w.verdict]?.fg || C.dark,background:VERDICT[w.verdict]?.bg || '#f3f4f6',padding:'2px 7px',borderRadius:6}}>
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {result.words.some((w:any)=>w.phonemes?.length) && (
            <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:12}}>
              {result.words.flatMap((w:any)=>w.phonemes||[]).map((p:any,i:number)=>(
                <span key={i} title={p.acc+'%'} style={{fontSize:'0.72rem',fontWeight:700,fontFamily:'ui-monospace,monospace',
                  color:VERDICT[p.verdict]?.fg || C.dark,background:VERDICT[p.verdict]?.bg || '#f3f4f6',padding:'2px 6px',borderRadius:5}}>
                  {p.ph}
                </span>
              ))}
            </div>
          )}
          <div style={{marginTop:10,fontSize:'0.8rem',color:C.warm,lineHeight:1.45,background:C.pageBg,borderRadius:10,padding:'8px 10px'}}>
            💡 {result.tip}
          </div>
        </div>
      )}

      {/* Error Card */}
      {phase==='error' && (
        <div style={{background:C.roseL,color:C.rose,borderRadius:14,padding:'12px 16px',fontSize:'0.85rem',marginBottom:16}}>
          {errMsg}
        </div>
      )}

      {/* Interaction Bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexDirection:'column'}}>
        {/* Recording Mic Button */}
        {!isPassed && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            <button onClick={onMic} disabled={micBusy}
              style={{width:64,height:64,borderRadius:'50%',border:'none',
                cursor:micBusy?'default':'pointer',
                background:phase==='recording'?C.gold:phase==='scoring'?C.purple:C.rose,color:'white',fontSize:'1.5rem',
                boxShadow:`0 6px 20px ${phase==='recording'?'rgba(245,158,11,.4)':'rgba(233,30,99,.35)'}`,
                animation:phase==='recording'?'pulse 1.2s ease-in-out infinite':'none'}}>
              {phase==='recording' ? '⏹' : phase==='scoring' ? '⏳' : '🎙️'}
            </button>
            <div style={{fontSize:'0.8rem',fontWeight:500,color:phase==='recording'?C.gold:phase==='scoring'?C.purple:C.warm}}>
              {phase==='recording'
                ? (lang==='ru'?'Слушаю... скажи фразу и нажми ⏹':'Listening... say the phrase and tap ⏹')
                : phase==='scoring'
                ? (lang==='ru'?'Оцениваю...':'Analyzing pronunciation...')
                : (lang==='ru'?'Нажми и начни говорить':'Tap to start speaking')}
            </div>
          </div>
        )}

        {/* Next/Complete Button (Only unlocked if passed >= 55) */}
        {isPassed && (
          <button onClick={next}
            style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:C.sage,color:'white',fontWeight:700,fontSize:'1.1rem',cursor:'pointer',boxShadow:'0 4px 14px rgba(91,140,90,0.3)'}}>
            {pos >= phrases.length - 1
              ? (lang==='ru'?'✅ Завершить урок':'✅ Complete lesson')
              : (lang==='ru'?'Следующая фраза →':'Next phrase →')}
          </button>
        )}
      </div>
    </div>
  );
}
