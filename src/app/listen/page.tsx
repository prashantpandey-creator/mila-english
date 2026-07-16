// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { ACCENTS, playPhrase, hasRealVoice, startListening, missedSound } from '@/lib/speech';
import { PHRASES, PACKS, SOUND_INFO } from '@/lib/phrases';
import { useScene } from '@/lib/scene';

const VERDICT = {
  good:  { fg: '#8fce84', bg: 'rgba(143,206,132,0.16)' },
  close: { fg: '#e0b64e', bg: 'rgba(212,175,55,0.18)' },
  miss:  { fg: '#e8556d', bg: 'rgba(232,85,109,0.16)' },
};

export default function ListenPage() {
  const { lang } = useI18n();
  const router = useRouter();
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
    const col = score >= 80 ? C.sage : score >= 55 ? C.gold : C.rose;
    return (
      <svg width="62" height="62" viewBox="0 0 62 62" style={{flex:'0 0 auto'}}>
        <circle cx="31" cy="31" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="7"/>
        <circle cx="31" cy="31" r={r} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 31 31)" style={{transition:'stroke-dashoffset .5s'}}/>
        <text x="31" y="37" textAnchor="middle" fontSize="19" fontWeight="800" fill={C.dark}>{score}</text>
      </svg>
    );
  };

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      <div style={{background:'rgba(0,0,0,0.84)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.3rem',color:C.dark,letterSpacing:'0.03em'}}>Mila</span>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:'0.7rem',fontWeight:700,color:C.purple,background:'rgba(167,139,250,0.16)',padding:'3px 9px',borderRadius:20}}>Level B1</span>
          <LangToggle/>
        </div>
      </div>

      <div style={{maxWidth:460,margin:'0 auto',padding:'22px 20px'}}>
        {/* pack picker */}
        <div style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',color:'#c9a961',marginBottom:8}}>
          {lang==='ru'?'Ситуация':'Situation'}
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:16}}>
          {PACKS.map(p=>(
            <button key={p.id} onClick={()=>onPack(p.id)}
              style={{flex:'0 0 auto',fontSize:'0.82rem',fontWeight:pack===p.id?700:600,cursor:'pointer',
                color:pack===p.id?'white':C.warm,background:pack===p.id?C.sage:'rgba(255,255,255,0.07)',
                border:pack===p.id?'none':'1px solid rgba(255,255,255,0.14)',padding:'7px 13px',borderRadius:20}}>
              {p.emoji} {lang==='ru'?p.ru:p.en}
            </button>
          ))}
        </div>

        {/* accent picker */}
        <div style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',color:'#c9a961',marginBottom:8}}>
          {lang==='ru'?'Акцент':'Accent'}
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:18}}>
          {ACCENTS.map(a=>(
            <button key={a.id} onClick={()=>setAccent(a)}
              style={{flex:'0 0 auto',fontSize:'0.85rem',fontWeight:accent.id===a.id?700:600,cursor:'pointer',
                color:accent.id===a.id?'white':C.warm,background:accent.id===a.id?C.rose:'rgba(255,255,255,0.07)',
                border:accent.id===a.id?'none':'1px solid rgba(255,255,255,0.14)',padding:'7px 14px',borderRadius:20}}>
              {a.flag} {a.label}
            </button>
          ))}
        </div>

        {/* phrase card */}
        <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'22px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.45)',marginBottom:14,
          border: inDrill ? '1.5px solid #e9d5ff' : 'none'}}>
          <div style={{fontSize:'0.72rem',color:inDrill?C.purple:'#9d9483',fontWeight:inDrill?700:600,marginBottom:8}}>
            {inDrill
              ? `🎯 ${lang==='ru'?'Персональная тренировка':'Personal drill'} · ${drillIdx!+1}/${drills.length} · /${phrase.sound}/`
              : `${lang==='ru'?'Слушай и повтори':'Listen & repeat'} · ${pos+1}/${items.length}`}
          </div>
          <div style={{fontSize:'1.4rem',fontWeight:700,color:C.dark,lineHeight:1.3}}>{phrase.text}</div>
          <div style={{fontSize:'0.85rem',color:'#9a8fb0',marginTop:6,fontFamily:'ui-monospace,monospace'}}>{phrase.ipa}</div>
          <button onClick={onListen} disabled={phase==='speaking'}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',marginTop:16,
              background:C.roseL,color:C.rose,fontWeight:700,fontSize:'0.95rem',padding:'12px',borderRadius:14,border:'none',
              cursor:phase==='speaking'?'default':'pointer',opacity:phase==='speaking'?0.7:1}}>
            🔊 {phase==='speaking' ? (lang==='ru'?'Звучит…':'Playing…') : `${lang==='ru'?'Прослушать':'Hear it'} — ${accent.flag} ${accent.label}`}
          </button>
          <div style={{textAlign:'center',fontSize:'0.68rem',color:'#8b8373',marginTop:8}}>
            {hasRealVoice(accent)
              ? (lang==='ru'?'✨ Настоящий голос носителя':'✨ Real native voice')
              : (lang==='ru'?'Синтетический голос — настоящий акцент скоро':'Synthetic for now — real accent coming')}
          </div>
        </div>

        {/* score / result */}
        {phase==='scored' && result && (
          <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'18px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.45)',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              {ring(result.score)}
              <div style={{flex:1}}>
                <div style={{fontSize:'0.9rem',fontWeight:700,color:C.dark,marginBottom:6}}>
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
            <div style={{marginTop:11,fontSize:'0.82rem',color:C.warm,lineHeight:1.45,background:C.pageBg,borderRadius:10,padding:'9px 11px'}}>
              💡 {result.tip}
            </div>
            <div style={{marginTop:8,fontSize:'0.8rem',color:'#9d9483'}}>{phrase.ru}</div>
          </div>
        )}

        {phase==='error' && (
          <div style={{background:C.roseL,color:C.rose,borderRadius:14,padding:'12px 16px',fontSize:'0.85rem',marginBottom:14,textAlign:'center'}}>{errMsg}</div>
        )}

        {/* mic + next */}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={next}
            style={{flex:1,height:52,borderRadius:16,border:'1.5px solid rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',color:C.warm,fontWeight:600,fontSize:'0.95rem',cursor:'pointer'}}>
            {lang==='ru'?'Следующая →':'Next phrase →'}
          </button>
          <button onClick={onMic} disabled={micBusy}
            aria-label={phase==='recording'?(lang==='ru'?'Остановить':'Stop'):(lang==='ru'?'Произнести':'Say it back')}
            style={{width:64,height:64,borderRadius:'50%',border:'none',
              cursor:micBusy?'default':'pointer',opacity:1,
              background:phase==='recording'?C.gold:phase==='scoring'?C.purple:C.rose,color:'white',fontSize:'1.5rem',
              boxShadow:`0 6px 20px ${phase==='recording'?'rgba(212,175,55,.4)':'rgba(233,30,99,.35)'}`,
              animation:phase==='recording'?'pulse 1.2s ease-in-out infinite':'none'}}>
            {phase==='recording' ? '⏹' : phase==='scoring' ? '⏳' : '🎙️'}
          </button>
        </div>
        <div style={{textAlign:'center',fontSize:'0.78rem',marginTop:10,
          color:phase==='recording'?C.gold:phase==='scoring'?C.purple:'#948b7c',
          fontWeight:(phase==='recording'||phase==='scoring')?700:400}}>
          {phase==='recording'
            ? (lang==='ru'?'Слушаю… говори, потом нажми ⏹ (или просто закончи)':'Listening… speak, then tap ⏹ (or just finish)')
            : phase==='scoring'
            ? (lang==='ru'?'Оцениваю на устройстве…':'Scoring on your device…')
            : (lang==='ru'?'Нажми и произнеси вслух':'Tap the mic and say it aloud')}
        </div>

        {/* weak-sound recap — grows as the session goes */}
        {misses.length > 0 && (
          <div style={{marginTop:18,background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'16px 18px',boxShadow:'0 2px 12px rgba(0,0,0,0.45)'}}>
            <div style={{fontSize:'0.8rem',fontWeight:800,color:C.dark,marginBottom:2}}>
              {lang==='ru'?'Звуки для тренировки':'Sounds to drill'}
            </div>
            <div style={{fontSize:'0.72rem',color:'#9d9483',marginBottom:12}}>
              {lang==='ru'?'Где ты чаще спотыкаешься':'Where you keep stumbling'}
            </div>
            {misses.map(([snd, info]) => {
              const meta = SOUND_INFO[snd] || { ex: info.example, en: '', ru: '' };
              return (
                <div key={snd} style={{display:'flex',alignItems:'flex-start',gap:11,marginBottom:11}}>
                  <span style={{flex:'0 0 auto',minWidth:34,height:34,padding:'0 8px',borderRadius:9,background:'rgba(232,85,109,0.16)',color:C.rose,
                    fontWeight:800,fontSize:'0.95rem',fontFamily:'ui-monospace,monospace',display:'flex',alignItems:'center',justifyContent:'center'}}>{snd}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.82rem',fontWeight:700,color:C.dark}}>
                      {lang==='ru'?`как в «${meta.ex}»`:`as in “${meta.ex}”`}
                      <span style={{fontWeight:600,color:'#948b7c'}}> · {info.count}×</span>
                    </div>
                    <div style={{fontSize:'0.76rem',color:C.warm,lineHeight:1.4,marginTop:1}}>{lang==='ru'?meta.ru:meta.en}</div>
                  </div>
                </div>
              );
            })}
            <button onClick={loadDrills} disabled={drillLoading}
              style={{width:'100%',marginTop:6,padding:'12px',borderRadius:12,border:'none',
                background:'linear-gradient(135deg,#c4b5fd,#a78bfa)',color:'white',fontWeight:800,fontSize:'0.9rem',
                cursor:drillLoading?'default':'pointer',opacity:drillLoading?0.7:1}}>
              {drillLoading
                ? (lang==='ru'?'✨ Мила готовит упражнения…':'✨ Mila is building your drills…')
                : (lang==='ru'?'✨ Тренировка от ИИ на мои слабые звуки':'✨ AI drills for my weak sounds')}
            </button>
          </div>
        )}

        <div style={{textAlign:'center',fontSize:'0.72rem',color:'#8b8373',marginTop:18,lineHeight:1.5}}>
          {lang==='ru'
            ? '🎯 Оценка по фонемам — модель на нашем сервере, мгновенно.'
            : '🎯 Phoneme-level scoring by our model — instant.'}
        </div>
      </div>
    </div>
  );
}
