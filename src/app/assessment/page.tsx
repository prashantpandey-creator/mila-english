// @ts-nocheck
'use client';

// VOICE assessment. This is a speaking app — the level test hears the learner
// talk, it doesn't read what they type. Reuses the /darshan realtime WebRTC loop
// with mode=assessment: the examiner interviews by voice, then calls
// finalize_assessment (a realtime function call) which we catch here and POST to
// /api/assessment/finalize (unchanged contract), then route to the dashboard.
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

type Phase = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'finalizing' | 'error';

export default function AssessmentVoice() {
  const { lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [examinerText, setExaminerText] = useState('');   // what Mila is saying
  const [youText, setYouText] = useState('');              // your last transcribed answer
  const [errMsg, setErrMsg] = useState('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { setM(true); }, []);
  useEffect(() => () => { pcRef.current?.close(); }, []);
  if (!m) return null;

  const finalize = async (args: any) => {
    setPhase('finalizing');
    try { pcRef.current?.close(); } catch {}
    try {
      const res = await fetch('/api/assessment/finalize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      if (res.ok) { router.push('/dashboard'); router.refresh(); }
      else { setErrMsg(lang==='ru'?'Не удалось сохранить результат.':'Could not save the result.'); setPhase('error'); }
    } catch { setErrMsg(lang==='ru'?'Ошибка сети.':'Network error.'); setPhase('error'); }
  };

  const start = async () => {
    if (phase !== 'idle' && phase !== 'error') return;
    setErrMsg(''); setExaminerText(''); setYouText(''); setPhase('connecting');
    try {
      const sess = await (await fetch('/api/session?mode=assessment')).json();
      const key = sess?.client_secret?.value;
      if (!key) throw new Error('token');

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      audioRef.current = new Audio();
      audioRef.current.autoplay = true;
      pc.ontrack = (e) => { if (audioRef.current) audioRef.current.srcObject = e.streams[0]; };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      // Accumulate function-call argument deltas by call id, fire on completion.
      const callArgs: Record<string, string> = {};

      dc.addEventListener('message', (e) => {
        let ev: any; try { ev = JSON.parse(e.data); } catch { return; }
        switch (ev.type) {
          case 'input_audio_buffer.speech_started':
            setPhase('listening'); break;
          case 'conversation.item.input_audio_transcription.completed':
            setYouText(ev.transcript || ''); break;
          case 'response.created':
            setPhase('thinking'); setExaminerText(''); break;
          case 'response.audio.delta':
            setPhase('speaking'); break;
          case 'response.audio_transcript.delta':
            setExaminerText(prev => prev + (ev.delta || '')); break;
          case 'response.function_call_arguments.delta':
            callArgs[ev.call_id] = (callArgs[ev.call_id] || '') + (ev.delta || ''); break;
          case 'response.function_call_arguments.done': {
            const raw = ev.arguments || callArgs[ev.call_id] || '{}';
            let args: any; try { args = JSON.parse(raw); } catch { args = null; }
            if (args?.level) finalize(args);
            break;
          }
          case 'response.done':
            setPhase(p => (p === 'speaking' ? 'listening' : p)); break;
          case 'error':
            console.error('realtime error', ev); break;
        }
      });

      dc.addEventListener('open', () => {
        // Ask for input transcription so we can show what the learner said.
        dc.send(JSON.stringify({ type: 'session.update', session: { input_audio_transcription: { model: 'whisper-1' } } }));
        // Nudge the examiner to greet + start the interview immediately.
        dc.send(JSON.stringify({ type: 'response.create' }));
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdp = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST', body: offer.sdp,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/sdp' },
      });
      if (!sdp.ok) throw new Error('sdp');
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdp.text() });
      setPhase('listening');
    } catch (err) {
      console.error(err);
      setErrMsg(lang==='ru'
        ? 'Не удалось начать. Разреши доступ к микрофону и открой в Chrome.'
        : 'Could not start. Allow microphone access and use Chrome.');
      setPhase('error');
    }
  };

  const live = phase === 'listening' || phase === 'thinking' || phase === 'speaking';
  const statusText = {
    idle:       lang==='ru' ? 'Голосовая проверка уровня' : 'Voice level assessment',
    connecting: lang==='ru' ? 'Соединяю…' : 'Connecting…',
    listening:  lang==='ru' ? 'Слушаю тебя…' : 'Listening to you…',
    thinking:   lang==='ru' ? 'Мила думает…' : 'Mila is thinking…',
    speaking:   lang==='ru' ? 'Мила говорит…' : 'Mila is speaking…',
    finalizing: lang==='ru' ? 'Составляю твой план…' : 'Building your plan…',
    error:      lang==='ru' ? 'Что-то пошло не так' : 'Something went wrong',
  }[phase];

  const orbColor = phase==='speaking' ? C.gold : phase==='listening' ? C.rose : phase==='thinking' ? C.purple : 'rgba(212,175,55,0.5)';

  return (
    <div style={{minHeight:'100vh',background:'transparent',fontFamily:"'Manrope','Inter',sans-serif",display:'flex',flexDirection:'column'}}>
      <div style={{background:C.navBg,backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',padding:'12px 20px',
        borderBottom:'1px solid rgba(212,175,55,0.18)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.3rem',color:C.dark,letterSpacing:'0.03em'}}>Mila</span>
        <LangToggle/>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',textAlign:'center',maxWidth:560,margin:'0 auto',width:'100%'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.24em',textTransform:'uppercase',color:'#c9a961',marginBottom:14}}>
          {lang==='ru'?'Собеседование':'The interview'}
        </div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'2rem',color:C.dark,margin:'0 0 8px',lineHeight:1.1}}>
          {lang==='ru'?'Поговори с Милой':'Speak with Mila'}
        </h1>
        <p style={{color:C.warm,fontSize:'0.95rem',lineHeight:1.6,margin:'0 0 34px',maxWidth:400}}>
          {lang==='ru'
            ? 'Мила задаст несколько вопросов вслух. Отвечай по-английски, как в разговоре — она услышит твой уровень и составит план.'
            : 'Mila will ask a few questions aloud. Answer in English, like a conversation — she hears your level and builds your plan.'}
        </p>

        {/* The orb — tap to begin, then it breathes with the conversation */}
        <button onClick={start} disabled={live || phase==='connecting' || phase==='finalizing'}
          aria-label={lang==='ru'?'Начать':'Begin'}
          style={{width:132,height:132,borderRadius:'50%',border:'1px solid rgba(212,175,55,0.4)',
            cursor:(phase==='idle'||phase==='error')?'pointer':'default',position:'relative',
            background:`radial-gradient(circle at 50% 40%, ${orbColor}, rgba(212,175,55,0.06) 70%)`,
            boxShadow:`0 0 60px ${orbColor}`,
            transition:'all 0.5s ease',
            animation: live ? 'pulse 2.4s ease-in-out infinite' : 'none'}}>
          <span style={{fontSize:'2.4rem'}}>{phase==='finalizing'?'✨':phase==='speaking'?'🌸':'🎙️'}</span>
        </button>

        <div style={{marginTop:22,fontSize:'0.9rem',fontWeight:700,
          color: phase==='speaking'?C.gold:phase==='listening'?C.rose:phase==='thinking'?C.purple:C.warm,
          minHeight:22}}>
          {statusText}
        </div>

        {/* Live captions — examiner's question + your answer */}
        {(examinerText || youText) && (
          <div style={{marginTop:22,width:'100%',display:'flex',flexDirection:'column',gap:10}}>
            {examinerText && (
              <div style={{background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:14,padding:'12px 16px',
                fontSize:'0.92rem',color:C.dark,textAlign:'left',lineHeight:1.5}}>
                <span style={{color:'#c9a961',fontWeight:700}}>Mila · </span>{examinerText}
              </div>
            )}
            {youText && (
              <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'12px 16px',
                fontSize:'0.92rem',color:C.warm,textAlign:'left',lineHeight:1.5}}>
                <span style={{color:C.rose,fontWeight:700}}>{lang==='ru'?'Ты · ':'You · '}</span>{youText}
              </div>
            )}
          </div>
        )}

        {phase==='error' && (
          <div style={{marginTop:20,background:C.roseL,color:C.rose,borderRadius:12,padding:'12px 16px',fontSize:'0.88rem',maxWidth:400}}>
            {errMsg}
            <button onClick={start} style={{display:'block',margin:'10px auto 0',padding:'8px 18px',borderRadius:10,border:'none',background:C.rose,color:'white',fontWeight:700,cursor:'pointer'}}>
              {lang==='ru'?'Попробовать снова':'Try again'}
            </button>
          </div>
        )}

        {phase==='idle' && (
          <div style={{marginTop:26,fontSize:'0.78rem',color:'#8b8373'}}>
            🎧 {lang==='ru'?'Нужен микрофон и Chrome':'Needs a microphone and Chrome'}
          </div>
        )}
      </div>
    </div>
  );
}
