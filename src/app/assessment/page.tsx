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
import ReliableAssessment from '@/components/ReliableAssessment';
import LocalVoiceAssessment from '@/components/LocalVoiceAssessment';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import type { AssessmentResult } from '@/lib/assessment';

type Phase = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'finalizing' | 'error';

export default function AssessmentVoice() {
  const { lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [examinerText, setExaminerText] = useState('');   // what Mila is saying
  const [youText, setYouText] = useState('');              // your last transcribed answer
  const [errMsg, setErrMsg] = useState('');
  const [mode, setMode] = useState<'choice' | 'voice' | 'local-voice' | 'reliable'>('choice');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const finalizeStartedRef = useRef(false);

  useEffect(() => { setM(true); }, []);
  useEffect(() => () => {
    pcRef.current?.close();
    mediaRef.current?.getTracks().forEach(track => track.stop());
  }, []);
  if (!m) return null;

  const stopVoice = () => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    mediaRef.current?.getTracks().forEach(track => track.stop());
    mediaRef.current = null;
  };

  const finalize = async (args: AssessmentResult | Record<string, unknown>, method: 'voice' | 'local-voice' | 'reliable' = 'voice') => {
    if (finalizeStartedRef.current) return;
    finalizeStartedRef.current = true;
    setPhase('finalizing');
    stopVoice();
    try {
      const res = await fetch('/api/assessment/finalize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, method }),
      });
      if (res.ok) { router.push('/dashboard'); router.refresh(); }
      else {
        finalizeStartedRef.current = false;
        setErrMsg(lang==='ru'?'Не удалось сохранить результат.':'Could not save the result.');
        setPhase('error');
      }
    } catch {
      finalizeStartedRef.current = false;
      setErrMsg(lang==='ru'?'Ошибка сети.':'Network error.'); setPhase('error');
    }
  };

  const start = async () => {
    if (phase !== 'idle' && phase !== 'error') return;
    finalizeStartedRef.current = false;
    setMode('voice');
    setErrMsg(''); setExaminerText(''); setYouText(''); setPhase('connecting');
    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      audioRef.current = new Audio();
      audioRef.current.autoplay = true;
      pc.ontrack = (e) => { if (audioRef.current) audioRef.current.srcObject = e.streams[0]; };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = ms;
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
          case 'response.output_audio.delta':
            setPhase('speaking'); break;
          case 'response.output_audio_transcript.delta':
            setExaminerText(prev => prev + (ev.delta || '')); break;
          case 'response.function_call_arguments.delta':
            callArgs[ev.call_id] = (callArgs[ev.call_id] || '') + (ev.delta || ''); break;
          case 'response.function_call_arguments.done': {
            const raw = ev.arguments || callArgs[ev.call_id] || '{}';
            let args: any; try { args = JSON.parse(raw); } catch { args = null; }
            if (args?.level) void finalize(args, 'voice');
            break;
          }
          case 'response.done': {
            const call = ev.response?.output?.find((item: any) =>
              item?.type === 'function_call' && item?.name === 'finalize_assessment'
            );
            if (call?.arguments) {
              let args: any; try { args = JSON.parse(call.arguments); } catch { args = null; }
              if (args?.level) void finalize(args, 'voice');
            }
            setPhase(p => (p === 'speaking' ? 'listening' : p)); break;
          }
          case 'error': {
            console.error('realtime error', ev);
            setErrMsg(lang==='ru'?'Ошибка голосового сервиса. Попробуй снова.':'The voice service reported an error. Please try again.');
            setPhase('error');
            break;
          }
        }
      });

      dc.addEventListener('open', () => {
        // Nudge the examiner to greet + start the interview immediately.
        dc.send(JSON.stringify({ type: 'response.create' }));
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdp = await fetch('/api/session?mode=assessment', {
        method: 'POST', body: offer.sdp,
        headers: { 'Content-Type': 'application/sdp' },
      });
      if (!sdp.ok) {
        const problem = await sdp.json().catch(() => null);
        throw new Error(problem?.code || 'OPENAI_SESSION_FAILED');
      }
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdp.text() });
      setPhase('listening');
    } catch (err) {
      console.error(err);
      pcRef.current?.close();
      mediaRef.current?.getTracks().forEach(track => track.stop());
      const notConfigured = err instanceof Error && err.message === 'OPENAI_NOT_CONFIGURED';
      setErrMsg(notConfigured
        ? (lang==='ru' ? 'Голосовая проверка ещё не настроена.' : 'Voice assessment is not configured yet.')
        : (lang==='ru'
          ? 'Не удалось начать. Разреши доступ к микрофону и попробуй снова.'
          : 'Could not start. Allow microphone access and try again.'));
      setPhase('error');
    }
  };

  const beginReliable = () => {
    stopVoice();
    finalizeStartedRef.current = false;
    setErrMsg('');
    setExaminerText('');
    setYouText('');
    setPhase('idle');
    setMode('reliable');
  };

  const beginLocalVoice = () => {
    stopVoice();
    finalizeStartedRef.current = false;
    setErrMsg(''); setExaminerText(''); setYouText(''); setPhase('idle');
    setMode('local-voice');
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

  const orbColor = phase==='speaking' || phase==='listening'
    ? C.voice
    : phase==='thinking' || phase==='connecting'
    ? C.mercury
    : phase==='finalizing'
    ? C.jupiter
    : phase==='error'
    ? C.rose
    : C.mercury;

  return (
    <div style={{minHeight:'100vh',background:'transparent',fontFamily:"'Manrope','Inter',sans-serif",display:'flex',flexDirection:'column'}}>
      <div style={{background:C.navBg,backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',padding:'12px 20px',
        borderBottom:'1px solid rgba(36,211,154,0.18)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.3rem',color:C.dark,letterSpacing:'0.03em'}}>Mila</span>
        <LangToggle/>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',textAlign:'center',maxWidth:610,margin:'0 auto',width:'100%'}}>
        {mode === 'local-voice' ? (
          <LocalVoiceAssessment
            key="local-voice-assessment"
            lang={lang}
            busy={phase === 'finalizing'}
            error={phase === 'error' ? errMsg : ''}
            onComplete={(result) => void finalize(result, 'local-voice')}
            onCancel={() => { setErrMsg(''); setPhase('idle'); setMode('choice'); }}
          />
        ) : mode === 'reliable' ? (
          <ReliableAssessment
            key="reliable-assessment"
            lang={lang}
            busy={phase === 'finalizing'}
            error={phase === 'error' ? errMsg : ''}
            onComplete={(result) => void finalize(result, 'reliable')}
            onCancel={() => { setErrMsg(''); setPhase('idle'); setMode('choice'); }}
          />
        ) : (
        <>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.24em',textTransform:'uppercase',color:C.jupiter,marginBottom:14}}>
          {lang==='ru'?'Проверка уровня':'Level assessment'}
        </div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'2rem',color:C.dark,margin:'0 0 8px',lineHeight:1.1}}>
          {lang==='ru'?'Узнай свой уровень':'Find your level'}
        </h1>
        <p style={{color:C.warm,fontSize:'0.95rem',lineHeight:1.6,margin:'0 0 34px',maxWidth:400}}>
          {lang==='ru'
            ? 'Основная голосовая проверка отправляет запись только на сервер Mila и рассчитана на работу в России без VPN.'
            : 'The primary voice check sends audio only to Mila and is designed to work in Russia without a VPN.'}
        </p>

        {mode === 'choice' && (
          <div style={{width:'100%',display:'grid',gap:11,marginBottom:24}}>
            <button type="button" onClick={beginLocalVoice}
              style={{width:'100%',padding:'15px 18px',borderRadius:13,border:'none',cursor:'pointer',
                background:`linear-gradient(135deg,${C.voice},${C.voiceBright})`,color:'#021418',fontWeight:800,fontSize:'0.98rem',
                boxShadow:'0 7px 24px rgba(106,220,245,.24)'}}>
              🎙️ {lang==='ru'?'Голосовая проверка · 3–5 минут':'Voice level check · 3–5 minutes'}
              <span style={{display:'block',fontSize:'0.73rem',fontWeight:600,opacity:.72,marginTop:3}}>
                {lang==='ru'?'Только сервер Mila · без VPN':'Mila server only · no VPN'}
              </span>
            </button>
            <button type="button" onClick={beginReliable}
              style={{width:'100%',padding:'12px 18px',borderRadius:13,cursor:'pointer',fontWeight:700,fontSize:'0.9rem',border:'1px solid rgba(255,255,255,.16)',background:'rgba(255,255,255,.05)',color:C.dark}}>
              {lang==='ru'?'Тест без микрофона · 5–7 минут':'No-microphone test · 5–7 minutes'}
            </button>
            <button type="button" onClick={start}
              style={{width:'100%',padding:'12px 18px',borderRadius:13,cursor:'pointer',fontWeight:700,fontSize:'0.9rem',
                border:'1px solid rgba(255,255,255,.16)',background:'rgba(255,255,255,.05)',color:C.dark}}>
              ✨ {lang==='ru'?'Живое AI-собеседование (где доступно)':'Live AI interview (where supported)'}
            </button>
          </div>
        )}

        {/* The orb — tap to begin, then it breathes with the conversation */}
        {mode === 'voice' && <button onClick={start} disabled={live || phase==='connecting' || phase==='finalizing'}
          aria-label={lang==='ru'?'Начать':'Begin'}
          style={{width:132,height:132,borderRadius:'50%',border:`1px solid ${orbColor}`,
            cursor:(phase==='idle'||phase==='error')?'pointer':'default',position:'relative',
            background:`radial-gradient(circle at 50% 40%, ${orbColor}, rgba(0,0,0,0.08) 72%)`,
            boxShadow:`0 0 60px ${orbColor}`,
            transition:'all 0.5s ease',
            animation: live ? 'pulse 2.4s ease-in-out infinite' : 'none'}}>
          <span style={{fontSize:'2.4rem'}}>{phase==='finalizing'?'✨':phase==='speaking'?'🌸':'🎙️'}</span>
        </button>}

        {mode === 'voice' && <div style={{marginTop:22,fontSize:'0.9rem',fontWeight:700,
          color: phase==='speaking'||phase==='listening'?C.voice:phase==='thinking'||phase==='connecting'?C.mercury:phase==='finalizing'?C.jupiter:phase==='error'?C.rose:C.warm,
          minHeight:22}}>
          {statusText}
        </div>}

        {/* Live captions — examiner's question + your answer */}
        {mode === 'voice' && (examinerText || youText) && (
          <div style={{marginTop:22,width:'100%',display:'flex',flexDirection:'column',gap:10}}>
            {examinerText && (
              <div style={{background:C.voiceL,border:'1px solid rgba(106,220,245,0.24)',borderRadius:14,padding:'12px 16px',
                fontSize:'0.92rem',color:C.dark,textAlign:'left',lineHeight:1.5}}>
                <span style={{color:C.voice,fontWeight:700}}>Mila · </span>{examinerText}
              </div>
            )}
            {youText && (
              <div style={{background:C.mercuryL,border:'1px solid rgba(36,211,154,0.22)',borderRadius:14,padding:'12px 16px',
                fontSize:'0.92rem',color:C.warm,textAlign:'left',lineHeight:1.5}}>
                <span style={{color:C.mercury,fontWeight:700}}>{lang==='ru'?'Ты · ':'You · '}</span>{youText}
              </div>
            )}
          </div>
        )}

        {mode === 'voice' && phase==='error' && (
          <div style={{marginTop:20,background:C.roseL,color:C.rose,borderRadius:12,padding:'12px 16px',fontSize:'0.88rem',maxWidth:400}}>
            {errMsg}
            <button onClick={start} style={{display:'block',margin:'10px auto 0',padding:'8px 18px',borderRadius:10,border:'none',background:C.mercury,color:'#02140f',fontWeight:700,cursor:'pointer'}}>
              {lang==='ru'?'Попробовать снова':'Try again'}
            </button>
            <button onClick={beginReliable} style={{display:'block',margin:'8px auto 0',padding:'8px 18px',borderRadius:10,border:`1px solid ${C.mercury}`,background:C.mercuryL,color:C.mercury,fontWeight:700,cursor:'pointer'}}>
              {lang==='ru'?'Пройти надёжный тест':'Use reliable test'}
            </button>
          </div>
        )}

        {mode === 'voice' && phase==='idle' && (
          <div style={{marginTop:26,fontSize:'0.78rem',color:'#8b8373'}}>
            🎧 {lang==='ru'?'Нужен микрофон и современный браузер':'Needs a microphone and a modern browser'}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
