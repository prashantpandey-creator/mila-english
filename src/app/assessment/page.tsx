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
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import { EditorialChoice, EditorialChoiceGroup } from '@/components/ui/EditorialChoice';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import type { AssessmentResult } from '@/lib/assessment';

type Phase = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'finalizing' | 'error';
const SIGNAL = '#b63d68';

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

  // Phase is communicated by the icon, copy, and motion. Mila keeps one visual
  // signal instead of changing hue as the voice loop advances.
  const orbColor = SIGNAL;

  return (
    <AppShell className="assessment-page">
      <AppHeader
        title={lang==='ru' ? 'Проверка уровня' : 'Level assessment'}
        eyebrow={lang==='ru' ? 'Голос и навыки' : 'Voice & skills'}
        actions={<LangToggle/>}
      />

      <AppMain width="work" centered className="assessment-page__main">
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
        <div className="focus-kicker">
          {lang==='ru'?'Проверка уровня':'Level assessment'}
        </div>
        <h1 className="focus-title">
          {lang==='ru'?'Узнай свой уровень':'Find your level'}
        </h1>
        <p className="focus-copy">
          {lang==='ru'
            ? 'Выбирай способ, в котором тебе спокойно. Mila заметит, что уже получается, и соберёт личный маршрут без оценочного давления.'
            : 'Choose the way that feels comfortable. Mila notices what already works and shapes a personal path without judgment.'}
        </p>

        {mode === 'choice' && (
          <EditorialChoiceGroup
            index="01"
            columns={3}
            label={lang==='ru' ? 'Выбери свой ритм' : 'Choose your rhythm'}
            note={lang==='ru' ? 'Каждый путь приводит к одному личному плану.' : 'Every route leads to the same personal learning plan.'}
          >
            <EditorialChoice
              title={lang==='ru' ? 'Поговорить с Милой' : 'Talk with Mila'}
              detail={lang==='ru' ? 'Голос · 3–5 минут · сервер Mila, без VPN' : 'Voice · 3–5 min · Mila server, no VPN'}
              mark="01"
              meta={lang==='ru' ? 'Советуем начать' : 'Best beginning'}
              icon={<MilaIcon name="voice" size={16}/>}
              featured
              onClick={beginLocalVoice}
            />
            <EditorialChoice
              title={lang==='ru' ? 'Ответить письменно' : 'Answer in writing'}
              detail={lang==='ru' ? 'Тихий режим · 5–7 минут · без микрофона' : 'Quiet mode · 5–7 min · no microphone'}
              mark="02"
              icon={<MilaIcon name="lessons" size={16}/>}
              onClick={beginReliable}
            />
            <EditorialChoice
              title={lang==='ru' ? 'Живой разговор' : 'Live conversation'}
              detail={lang==='ru' ? 'Голосовое собеседование · доступ зависит от региона' : 'Voice interview · availability depends on region'}
              mark="03"
              meta={lang==='ru' ? 'По желанию' : 'Optional'}
              icon={<MilaIcon name="sparkle" size={16}/>}
              onClick={start}
            />
          </EditorialChoiceGroup>
        )}

        {/* The orb — tap to begin, then it breathes with the conversation */}
        {mode === 'voice' && <button onClick={start} disabled={live || phase==='connecting' || phase==='finalizing'}
          aria-label={lang==='ru'?'Начать':'Begin'}
          className={`assessment-page__orb ${live ? 'is-live' : ''}`}
          style={{'--assessment-orb':orbColor,cursor:(phase==='idle'||phase==='error')?'pointer':'default'} as any}>
          <MilaIcon
            name={phase==='finalizing'?'sparkle':phase==='speaking'?'conversation':'voice'}
            size={38}
          />
        </button>}

        {mode === 'voice' && <div className="assessment-page__status" style={{
          color: phase==='idle'?C.warm:SIGNAL,
        }}>
          {statusText}
        </div>}

        {/* Live captions — examiner's question + your answer */}
        {mode === 'voice' && (examinerText || youText) && (
          <div className="assessment-page__captions" aria-live="polite">
            {examinerText && (
              <div className="assessment-page__caption is-mila">
                <span style={{color:SIGNAL,fontWeight:700}}>Mila · </span>{examinerText}
              </div>
            )}
            {youText && (
              <div className="assessment-page__caption is-you">
                <span style={{color:SIGNAL,fontWeight:700}}>{lang==='ru'?'Ты · ':'You · '}</span>{youText}
              </div>
            )}
          </div>
        )}

        {mode === 'voice' && phase==='error' && (
          <div className="assessment-page__error" role="alert">
            {errMsg}
            <button onClick={start} className="focus-button focus-button--voice">
              {lang==='ru'?'Попробовать снова':'Try again'}
            </button>
            <button onClick={beginReliable} className="focus-button focus-button--quiet">
              {lang==='ru'?'Пройти надёжный тест':'Use reliable test'}
            </button>
          </div>
        )}

        {mode === 'voice' && phase==='idle' && (
          <div className="assessment-page__hint">
            <MilaIcon name="listening" size={15}/>
            <span>{lang==='ru'?'Нужен микрофон и современный браузер':'Needs a microphone and a modern browser'}</span>
          </div>
        )}
        </>
        )}
      </AppMain>
    </AppShell>
  );
}
