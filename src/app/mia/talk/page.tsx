'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { primeMicrophoneAudioContext } from '@/lib/microphone';
import { connectRealtimeVoice, type RealtimeVoiceSession } from '@/lib/realtimeVoice';
import './mia-talk.css';

type VoicePhase = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

function connectionError(error: unknown, lang: 'en' | 'ru'): string {
  const code = error instanceof Error ? error.message : '';
  const ru = lang === 'ru';
  if (code === 'permission-denied') {
    return ru
      ? 'Микрофон заблокирован. Разреши доступ в настройках браузера и попробуй снова.'
      : 'Microphone access is blocked. Allow it in browser settings and try again.';
  }
  if (code === 'no-microphone' || code === 'microphone-start-failed') {
    return ru
      ? 'Mia не нашла доступный микрофон. Проверь устройство и попробуй снова.'
      : 'Mia could not find an available microphone. Check the device and try again.';
  }
  if (code === 'RATE_LIMITED') {
    return ru
      ? 'Слишком много новых разговоров подряд. Подожди немного и попробуй снова.'
      : 'Too many new conversations started in a short time. Wait a moment and try again.';
  }
  if (code === 'OPENAI_NOT_CONFIGURED') {
    return ru
      ? 'Живой голос Mia сейчас не настроен.'
      : 'Mia Live voice is not configured right now.';
  }
  // Mia shares the /api/session boundary with Gia, so she inherited the same
  // 2026-08-16 lie: a billing outage rendered as "check the network".
  if (code === 'OPENAI_QUOTA_EXHAUSTED') {
    return ru
      ? 'Живой голос недоступен — на нашей стороне закончился сервисный баланс. Дело не в твоей сети.'
      : 'Live voice is down on our side — our service credit has run out. It is not your network.';
  }
  if (code === 'OPENAI_RATE_LIMITED') {
    return ru
      ? 'Голосовой сервис сейчас перегружен. Подожди минуту и попробуй снова.'
      : 'The voice service is busy right now. Wait a minute, then try again.';
  }
  return ru
    ? 'Mia не смогла подключить живой голос. Проверь сеть и попробуй снова.'
    : 'Mia could not connect Live voice. Check the network and try again.';
}

export default function MiaTalkPage() {
  const { lang } = useI18n();
  const locale = lang === 'ru' ? 'ru' : 'en';
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [consentOpen, setConsentOpen] = useState(false);
  const [error, setError] = useState('');
  const [userText, setUserText] = useState('');
  const [miaText, setMiaText] = useState('');
  const sessionRef = useRef<RealtimeVoiceSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const copy = locale === 'ru'
    ? {
        eyebrow: 'MIA · ЖИВОЙ РАЗГОВОР',
        title: 'Потренируй момент до поездки.',
        intro: 'Расскажи Mia, куда ты едешь и какой разговор хочешь прожить. Она сыграет сцену, поможет с естественной фразой и даст тебе ответить своим голосом.',
        start: 'Начать разговор',
        stop: 'Закончить разговор',
        retry: 'Попробовать снова',
        interrupt: 'Перебить Mia',
        back: 'Вернуться к местам',
        idle: 'Готова к новому месту',
        connecting: 'Соединяем с Mia…',
        listening: 'Mia слушает',
        thinking: 'Mia думает',
        speaking: 'Mia отвечает',
        you: 'Ты',
        mia: 'Mia',
        prompt: 'Например: «Я еду в Джайпур и хочу заказать чай на хинди».',
        consentTitle: 'Включить живой голос Mia?',
        consentBody: 'После твоего согласия звук с микрофона и его расшифровка отправляются в OpenAI для разговора в реальном времени. До нажатия «Согласен» ничего не отправляется. Этот разговор не сохраняется в Mia.',
        cancel: 'Не сейчас',
        agree: 'Согласен — начать',
        disclosure: 'Mia — ИИ, а не местный гид. Проверяй важные, текущие и связанные с безопасностью детали отдельно.',
      }
    : {
        eyebrow: 'MIA · LIVE CONVERSATION',
        title: 'Rehearse the moment before you arrive.',
        intro: 'Tell Mia where you are going and which conversation you want to live through. She will play the scene, help with a natural line, and give you room to answer in your own voice.',
        start: 'Start a conversation',
        stop: 'End conversation',
        retry: 'Try again',
        interrupt: 'Interrupt Mia',
        back: 'Back to places',
        idle: 'Ready for a new place',
        connecting: 'Connecting to Mia…',
        listening: 'Mia is listening',
        thinking: 'Mia is thinking',
        speaking: 'Mia is replying',
        you: 'You',
        mia: 'Mia',
        prompt: 'Try: “I am going to Jaipur and want to order chai in Hindi.”',
        consentTitle: 'Turn on Mia Live voice?',
        consentBody: 'After you agree, microphone audio and its transcript are sent to OpenAI for the live conversation. Nothing is sent before you choose “I agree.” This conversation is not saved by Mia.',
        cancel: 'Not now',
        agree: 'I agree — start',
        disclosure: 'Mia is AI, not a local guide. Verify important, current, and safety-critical details separately.',
      };

  const stopConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
    setPhase('idle');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      sessionRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!consentOpen) return;
    confirmRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConsentOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [consentOpen]);

  const beginConversation = useCallback(async () => {
    setConsentOpen(false);
    setError('');
    setUserText('');
    setMiaText('');
    setPhase('connecting');
    primeMicrophoneAudioContext();

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const session = await connectRealtimeVoice({
        lang: locale,
        mode: 'mia',
        signal: controller.signal,
        openAIAudioConsent: true,
        events: {
          onListening: () => {
            if (mountedRef.current) setPhase('listening');
          },
          onUserTranscript: (text) => {
            if (!mountedRef.current) return;
            setUserText(text);
            setMiaText('');
          },
          onThinking: () => {
            if (mountedRef.current) setPhase('thinking');
          },
          onSpeaking: () => {
            if (mountedRef.current) setPhase('speaking');
          },
          onAssistantDelta: (text) => {
            if (mountedRef.current) setMiaText(text);
          },
          onTurnComplete: (turn) => {
            if (!mountedRef.current) return;
            setUserText(turn.user);
            setMiaText(turn.assistant);
          },
          onServiceError: (problem) => {
            console.error('Mia Realtime service event', problem);
          },
          onDisconnect: () => {
            sessionRef.current = null;
            if (!mountedRef.current) return;
            setError(locale === 'ru' ? 'Связь с Mia прервалась. Попробуй снова.' : 'The connection to Mia ended. Try again.');
            setPhase('error');
          },
        },
      });

      if (!mountedRef.current || controller.signal.aborted) {
        session.close();
        return;
      }
      sessionRef.current = session;
      setPhase('listening');
    } catch (problem) {
      if (!mountedRef.current || controller.signal.aborted) return;
      setError(connectionError(problem, locale));
      setPhase('error');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [locale]);

  const active = phase === 'listening' || phase === 'thinking' || phase === 'speaking';
  const phaseLabel = phase === 'connecting'
    ? copy.connecting
    : phase === 'listening'
      ? copy.listening
      : phase === 'thinking'
        ? copy.thinking
        : phase === 'speaking'
          ? copy.speaking
          : copy.idle;

  return (
    <main className={'mia-talk mia-talk--' + phase}>
      <header className="mia-talk__nav">
        <Link className="mia-talk__brand" href="/" aria-label="Mia home">
          <span aria-hidden="true">M</span>
          <strong>Mia</strong>
          <small>travel · language · culture</small>
        </Link>
        <div>
          <LangToggle />
          <Link href="/">{copy.back}</Link>
        </div>
      </header>

      <section className="mia-talk__stage">
        <div className="mia-talk__copy">
          <p className="mia-talk__eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="mia-talk__intro">{copy.intro}</p>
          <p className="mia-talk__prompt">{copy.prompt}</p>
        </div>

        <div className="mia-talk__console" data-phase={phase}>
          <div className="mia-talk__signal" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span />
          </div>
          <p className="mia-talk__status" aria-live="polite"><i />{phaseLabel}</p>

          <div className="mia-talk__transcript" aria-live="polite">
            {userText ? <p><strong>{copy.you}</strong><span>{userText}</span></p> : null}
            {miaText ? <p className="is-mia"><strong>{copy.mia}</strong><span>{miaText}</span></p> : null}
            {!userText && !miaText ? <p className="is-empty">{copy.prompt}</p> : null}
          </div>

          {error ? <p className="mia-talk__error" role="alert">{error}</p> : null}

          <div className="mia-talk__actions">
            {active ? (
              <>
                {phase === 'speaking' ? (
                  <button type="button" className="mia-talk__secondary" onClick={() => sessionRef.current?.interrupt()}>
                    {copy.interrupt}
                  </button>
                ) : null}
                <button type="button" className="mia-talk__primary" onClick={stopConversation}>{copy.stop}</button>
              </>
            ) : (
              <button
                type="button"
                className="mia-talk__primary"
                disabled={phase === 'connecting'}
                onClick={() => setConsentOpen(true)}
              >
                {phase === 'error' ? copy.retry : phase === 'connecting' ? copy.connecting : copy.start}
              </button>
            )}
          </div>
        </div>
      </section>

      <p className="mia-talk__disclosure">{copy.disclosure}</p>

      {consentOpen ? (
        <div className="mia-talk__consent" role="dialog" aria-modal="true" aria-labelledby="mia-consent-title">
          <button type="button" className="mia-talk__consent-backdrop" onClick={() => setConsentOpen(false)} aria-label={copy.cancel} />
          <section>
            <p>MIA LIVE · MICROPHONE</p>
            <h2 id="mia-consent-title">{copy.consentTitle}</h2>
            <div>{copy.consentBody}</div>
            <footer>
              <button type="button" onClick={() => setConsentOpen(false)}>{copy.cancel}</button>
              <button ref={confirmRef} type="button" className="is-primary" onClick={() => void beginConversation()}>{copy.agree}</button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
