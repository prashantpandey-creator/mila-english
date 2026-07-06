// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { ACCENTS, playPhrase, hasRealVoice, startListening, missedSound } from '@/lib/speech';
import { PHRASES, PACKS, SOUND_INFO } from '@/lib/phrases';

const VERDICT = {
  good:  { fg: '#3f7a3e', bg: '#e8f5e9' },
  close: { fg: '#b45309', bg: '#fef3c7' },
  miss:  { fg: '#e91e63', bg: '#fce4ec' },
};

export default function ListenPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [pack, setPack] = useState(PACKS[0].id);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<'idle'|'speaking'|'recording'|'scoring'|'scored'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errMsg, setErrMsg] = useState('');
  const [session, setSession] = useState<any>(null);
  const [soundMisses, setSoundMisses] = useState<Record<string,{count:number;example:string}>>({});

  useEffect(() => { setM(true); }, []);
  useEffect(() => { if (typeof window !== 'undefined') window.speechSynthesis?.getVoices(); }, [m]);
  if (!m) return null;

  // Phrases of the current pack, carrying their global index (= audio file index).
  const items = PHRASES.map((p, i) => ({ ...p, gi: i })).filter((p) => p.pack === pack);
  const phrase = items[pos] || items[0];

  const onPack = (id: string) => {
    setPack(id); setPos(0); setResult(null); setPhase('idle'); setErrMsg(''); setSession(null);
  };

  const onListen = async () => {
    setPhase('speaking');
    await playPhrase(phrase.gi, accent, phrase.text);
    setPhase(p => (p === 'speaking' ? 'idle' : p));
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
    setErrMsg(e?.message === 'unsupported'
      ? (lang==='ru' ? 'Микрофон не поддерживается — открой в Chrome.' : 'Speech input needs Chrome — open there to practice.')
      : (lang==='ru' ? 'Не расслышала. Попробуй ещё раз.' : "Didn't catch that. Try again."));
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

  const next = () => { setPos(i => (i + 1) % items.length); setResult(null); setPhase('idle'); setErrMsg(''); setSession(null); };
  const micBusy = phase === 'scoring' || (phase === 'recording' && !session);
  const misses = Object.entries(soundMisses).sort((a, b) => b[1].count - a[1].count).slice(0, 4);

  const ring = (score: number) => {
    const r = 26, circ = 2 * Math.PI * r, off = circ - (score / 100) * circ;
    const col = score >= 80 ? C.sage : score >= 55 ? C.gold : C.rose;
    return (
      <svg width="62" height="62" viewBox="0 0 62 62" style={{flex:'0 0 auto'}}>
        <circle cx="31" cy="31" r={r} fill="none" stroke="#f0ece7" strokeWidth="7"/>
        <circle cx="31" cy="31" r={r} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 31 31)" style={{transition:'stroke-dashoffset .5s'}}/>
        <text x="31" y="37" textAnchor="middle" fontSize="19" fontWeight="800" fill={C.dark}>{score}</text>
      </svg>
    );
  };

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(0,0,0,0.04)',position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:'0.7rem',fontWeight:700,color:C.purple,background:'#ede9fe',padding:'3px 9px',borderRadius:20}}>Level B1</span>
          <LangToggle/>
        </div>
      </div>

      <div style={{maxWidth:460,margin:'0 auto',padding:'22px 20px'}}>
        {/* pack picker */}
        <div style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',color:'#b08968',marginBottom:8}}>
          {lang==='ru'?'Ситуация':'Situation'}
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:16}}>
          {PACKS.map(p=>(
            <button key={p.id} onClick={()=>onPack(p.id)}
              style={{flex:'0 0 auto',fontSize:'0.82rem',fontWeight:pack===p.id?700:600,cursor:'pointer',
                color:pack===p.id?'white':C.warm,background:pack===p.id?C.sage:'white',
                border:pack===p.id?'none':'1px solid #e0e6da',padding:'7px 13px',borderRadius:20}}>
              {p.emoji} {lang==='ru'?p.ru:p.en}
            </button>
          ))}
        </div>

        {/* accent picker */}
        <div style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',color:'#b08968',marginBottom:8}}>
          {lang==='ru'?'Акцент':'Accent'}
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:18}}>
          {ACCENTS.map(a=>(
            <button key={a.id} onClick={()=>setAccent(a)}
              style={{flex:'0 0 auto',fontSize:'0.85rem',fontWeight:accent.id===a.id?700:600,cursor:'pointer',
                color:accent.id===a.id?'white':C.warm,background:accent.id===a.id?C.rose:'white',
                border:accent.id===a.id?'none':'1px solid #efe0d4',padding:'7px 14px',borderRadius:20}}>
              {a.flag} {a.label}
            </button>
          ))}
        </div>

        {/* phrase card */}
        <div style={{background:'white',borderRadius:20,padding:'22px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.05)',marginBottom:14}}>
          <div style={{fontSize:'0.72rem',color:'#a8a29e',fontWeight:600,marginBottom:8}}>
            {lang==='ru'?'Слушай и повтори':'Listen & repeat'} · {pos+1}/{items.length}
          </div>
          <div style={{fontSize:'1.4rem',fontWeight:700,color:C.dark,lineHeight:1.3}}>{phrase.text}</div>
          <div style={{fontSize:'0.85rem',color:'#9a8fb0',marginTop:6,fontFamily:'ui-monospace,monospace'}}>{phrase.ipa}</div>
          <button onClick={onListen} disabled={phase==='speaking'}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',marginTop:16,
              background:C.roseL,color:C.rose,fontWeight:700,fontSize:'0.95rem',padding:'12px',borderRadius:14,border:'none',
              cursor:phase==='speaking'?'default':'pointer',opacity:phase==='speaking'?0.7:1}}>
            🔊 {phase==='speaking' ? (lang==='ru'?'Звучит…':'Playing…') : `${lang==='ru'?'Прослушать':'Hear it'} — ${accent.flag} ${accent.label}`}
          </button>
          <div style={{textAlign:'center',fontSize:'0.68rem',color:'#c0b8af',marginTop:8}}>
            {hasRealVoice(accent)
              ? (lang==='ru'?'✨ Настоящий голос носителя':'✨ Real native voice')
              : (lang==='ru'?'Синтетический голос — настоящий акцент скоро':'Synthetic for now — real accent coming')}
          </div>
        </div>

        {/* score / result */}
        {phase==='scored' && result && (
          <div style={{background:'white',borderRadius:20,padding:'18px 20px',boxShadow:'0 2px 16px rgba(0,0,0,0.05)',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              {ring(result.score)}
              <div style={{flex:1}}>
                <div style={{fontSize:'0.9rem',fontWeight:700,color:C.dark,marginBottom:6}}>
                  {result.score>=80?(lang==='ru'?'Почти как носитель':'Nearly native'):result.score>=55?(lang==='ru'?'Хорошо, шлифуем':'Good — polish it'):(lang==='ru'?'Ещё разок':'One more pass')}
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
            <div style={{marginTop:8,fontSize:'0.8rem',color:'#a8a29e'}}>{phrase.ru}</div>
          </div>
        )}

        {phase==='error' && (
          <div style={{background:C.roseL,color:C.rose,borderRadius:14,padding:'12px 16px',fontSize:'0.85rem',marginBottom:14,textAlign:'center'}}>{errMsg}</div>
        )}

        {/* mic + next */}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={next}
            style={{flex:1,height:52,borderRadius:16,border:'1.5px solid #efe0d4',background:'white',color:C.warm,fontWeight:600,fontSize:'0.95rem',cursor:'pointer'}}>
            {lang==='ru'?'Следующая →':'Next phrase →'}
          </button>
          <button onClick={onMic} disabled={micBusy}
            aria-label={phase==='recording'?(lang==='ru'?'Остановить':'Stop'):(lang==='ru'?'Произнести':'Say it back')}
            style={{width:64,height:64,borderRadius:'50%',border:'none',
              cursor:micBusy?'default':'pointer',opacity:1,
              background:phase==='recording'?C.gold:phase==='scoring'?C.purple:C.rose,color:'white',fontSize:'1.5rem',
              boxShadow:`0 6px 20px ${phase==='recording'?'rgba(245,158,11,.4)':'rgba(233,30,99,.35)'}`,
              animation:phase==='recording'?'pulse 1.2s ease-in-out infinite':'none'}}>
            {phase==='recording' ? '⏹' : phase==='scoring' ? '⏳' : '🎙️'}
          </button>
        </div>
        <div style={{textAlign:'center',fontSize:'0.78rem',marginTop:10,
          color:phase==='recording'?C.gold:phase==='scoring'?C.purple:'#b0a89f',
          fontWeight:(phase==='recording'||phase==='scoring')?700:400}}>
          {phase==='recording'
            ? (lang==='ru'?'Слушаю… говори, потом нажми ⏹ (или просто закончи)':'Listening… speak, then tap ⏹ (or just finish)')
            : phase==='scoring'
            ? (lang==='ru'?'Оцениваю на устройстве…':'Scoring on your device…')
            : (lang==='ru'?'Нажми и произнеси вслух':'Tap the mic and say it aloud')}
        </div>

        {/* weak-sound recap — grows as the session goes */}
        {misses.length > 0 && (
          <div style={{marginTop:18,background:'white',borderRadius:16,padding:'16px 18px',boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
            <div style={{fontSize:'0.8rem',fontWeight:800,color:C.dark,marginBottom:2}}>
              {lang==='ru'?'Звуки для тренировки':'Sounds to drill'}
            </div>
            <div style={{fontSize:'0.72rem',color:'#a8a29e',marginBottom:12}}>
              {lang==='ru'?'Где ты чаще спотыкаешься':'Where you keep stumbling'}
            </div>
            {misses.map(([snd, info]) => {
              const meta = SOUND_INFO[snd] || { ex: info.example, en: '', ru: '' };
              return (
                <div key={snd} style={{display:'flex',alignItems:'flex-start',gap:11,marginBottom:11}}>
                  <span style={{flex:'0 0 auto',minWidth:34,height:34,padding:'0 8px',borderRadius:9,background:'#fce4ec',color:C.rose,
                    fontWeight:800,fontSize:'0.95rem',fontFamily:'ui-monospace,monospace',display:'flex',alignItems:'center',justifyContent:'center'}}>{snd}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.82rem',fontWeight:700,color:C.dark}}>
                      {lang==='ru'?`как в «${meta.ex}»`:`as in “${meta.ex}”`}
                      <span style={{fontWeight:600,color:'#b0a89f'}}> · {info.count}×</span>
                    </div>
                    <div style={{fontSize:'0.76rem',color:C.warm,lineHeight:1.4,marginTop:1}}>{lang==='ru'?meta.ru:meta.en}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{textAlign:'center',fontSize:'0.72rem',color:'#c0b8af',marginTop:18,lineHeight:1.5}}>
          {lang==='ru'
            ? '🎯 Оценка по фонемам — модель на нашем сервере, мгновенно.'
            : '🎯 Phoneme-level scoring by our model — instant.'}
        </div>
      </div>
    </div>
  );
}
