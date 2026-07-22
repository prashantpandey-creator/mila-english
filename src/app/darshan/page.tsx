"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "ai/react";
import { useRouter } from "next/navigation";
import { MilaAurora } from "@/components/voice/MilaAurora";
import { MilaOrb, type OrbState } from "@/components/voice/MilaOrb";
import { MilaKid } from "@/components/voice/MilaKid";
import { useI18n } from "@/lib/i18n-provider";
import { startLocalTranscription, type LocalTranscript, type TranscriptionSession } from "@/lib/localTranscription";
import { connectRealtimeVoice, type RealtimeVoiceSession } from "@/lib/realtimeVoice";
import { microphoneErrorMessage, primeMicrophoneAudioContext } from "@/lib/microphone";
import { ensureGuestSession } from "@/lib/guestSession";
import { createStreamingTtsSession, spokenLocaleForText, ttsSpeak, type StreamingTtsSession } from "@/lib/tts";
import { toSpokenText } from "@/lib/spokenText";
import { announceCompanionHistoryUpdated } from "@/lib/use-companion-history";

const INVITES = [
  "What do you wish to know?",
  "Bring your question.",
  "Ask, and the AI will answer.",
  "Even silence is heard.",
  "What do you seek?",
];

type VoicePreference = "private" | "realtime";

const REALTIME_CONSENT_VALUE = "realtime-consent-v1";

function voicePreferenceKey(userId: number): string {
  return `mila-voice-preference-v1:${userId}`;
}

function completeSpokenPrefix(value: string): string {
  const endings = [...value.matchAll(/[.!?…]+["')\]]*(?=\s|$)/gu)];
  const last = endings[endings.length - 1];
  return last ? value.slice(0, (last.index ?? 0) + last[0].length).trim() : "";
}

export default function VoicePage() {
  const router = useRouter();
  const { lang } = useI18n();

  const [phase, setPhase] = useState<OrbState>("resting");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [voicePreference, setVoicePreference] = useState<VoicePreference>("private");
  const [preferenceUserId, setPreferenceUserId] = useState<number | null>(null);
  const [showRealtimeConsent, setShowRealtimeConsent] = useState(false);

  const [liveText, setLiveText] = useState("");
  const [answer, setAnswer] = useState("");
  const [invI, setInvI] = useState(0);
  const [orbSize, setOrbSize] = useState(320);
  // Every voice conversation is now the free, guest-open companion on the good
  // OpenAI Realtime voice (owner decision 2026-07-21: the private/local mode and
  // its "Private" toggle caused persistent broken-conversation confusion across
  // every entry point). The on-device engine stays ONLY as an invisible fallback
  // when the cloud is unreachable (Russia / no VPN). Kept named `freeMode` so all
  // the existing free-companion wiring applies at once: 'companion' Realtime mode
  // (guest-open, free — realtimeAccess.ts), Realtime-first in connectToVoice, the
  // guest-session seat, and no privacy toggle rendered.
  const [freeMode] = useState(true);
  // Kids learning mode (?kids=1): the sweet children's persona + the animated
  // MilaKid buddy instead of the abstract orb. Rides the same free, guest-open,
  // Realtime-first plumbing as the companion.
  const [kidsMode] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("kids") === "1");

  const transcriptionRef = useRef<TranscriptionSession | null>(null);
  const realtimeRef = useRef<RealtimeVoiceSession | null>(null);
  const engineRef = useRef<"realtime" | "local" | null>(null);
  const speechSessionRef = useRef<Promise<StreamingTtsSession> | null>(null);
  const listeningStartRef = useRef(false);
  const connectingRef = useRef(false);
  const loadingRef = useRef(false);
  const turnRef = useRef(0);
  const requestTurnRef = useRef<number | null>(null);
  const requestUserMessageIdRef = useRef<string | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const mountedRef = useRef(false);
  const connectionAttemptRef = useRef(0);
  const voiceConnectAbortRef = useRef<AbortController | null>(null);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});
  const guestSessionRef = useRef<Promise<boolean> | null>(null);

  // Seat first-time visitors while they read the invitation. Realtime and its
  // local fallback then share one unique guest identity instead of placing all
  // Android Chrome visitors in the same user-agent rate-limit bucket.
  useEffect(() => {
    if (!freeMode) return;
    guestSessionRef.current = ensureGuestSession();
  }, [freeMode]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
  }, []);

  const scheduleListening = useCallback((turnId: number, delay = 350) => {
    clearRestartTimer();
    const attempt = () => {
      restartTimerRef.current = null;
      if (!activeRef.current || turnRef.current !== turnId) return;
      if (loadingRef.current || speechSessionRef.current) {
        restartTimerRef.current = window.setTimeout(attempt, 100);
        return;
      }
      void startListeningRef.current();
    };
    restartTimerRef.current = window.setTimeout(attempt, delay);
  }, [clearRestartTimer]);

  const cancelSpeechSession = useCallback(() => {
    const pending = speechSessionRef.current;
    speechSessionRef.current = null;
    if (pending) void pending.then((session) => session.cancel());
    window.speechSynthesis?.cancel();
  }, []);

  const { append, isLoading, messages, stop } = useChat({
    id: "mila-voice-local",
    api: "/api/chat",
    // This hook is exclusively the private fallback. Realtime uses its own
    // WebRTC session and is only entered after explicit consent below.
    body: { context: { pathname: "/darshan", lang, surface: "voice", privacyMode: "local" } },
    keepLastMessageOnError: true,
    onError: () => {
      const failedTurn = requestTurnRef.current;
      requestTurnRef.current = null;
      requestUserMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      cancelSpeechSession();
      if (failedTurn === null || failedTurn !== turnRef.current) return;
      setVoiceError(lang === "ru"
        ? "Мила не смогла ответить. Коснись сферы, чтобы попробовать снова."
        : "Mila could not answer. Touch the orb to try again.");
      setPhase("resting");
    },
    onFinish: (message, { finishReason }) => {
      const completedTurn = requestTurnRef.current;
      if (completedTurn === null || completedTurn !== turnRef.current) return;
      if (assistantMessageIdRef.current && assistantMessageIdRef.current !== message.id) return;
      assistantMessageIdRef.current = message.id;
      const reply = toSpokenText(message.content);
      if (!reply) {
        requestTurnRef.current = null;
        requestUserMessageIdRef.current = null;
        assistantMessageIdRef.current = null;
        cancelSpeechSession();
        setPhase("resting");
        scheduleListening(completedTurn);
        return;
      }
      announceCompanionHistoryUpdated();
      setAnswer(reply);
      setPhase("manifesting");
      const pending = speechSessionRef.current;
      const speaking = pending
        ? pending.then((session) => session.finish(reply, finishReason !== "length"))
        : ttsSpeak(
            finishReason === "length" ? completeSpokenPrefix(reply) : reply,
            spokenLocaleForText(reply, lang === "ru" ? "ru-RU" : "en-US"),
            0.9,
          );
      void speaking.finally(() => {
        if (requestTurnRef.current !== completedTurn || turnRef.current !== completedTurn) return;
        if (speechSessionRef.current === pending) speechSessionRef.current = null;
        requestTurnRef.current = null;
        requestUserMessageIdRef.current = null;
        assistantMessageIdRef.current = null;
        if (!activeRef.current) return;
        setPhase("resting");
        scheduleListening(completedTurn);
      });
    },
  });
  loadingRef.current = isLoading;

  useEffect(() => {
    const currentTurn = requestTurnRef.current;
    const userMessageId = requestUserMessageIdRef.current;
    if (!isLoading || currentTurn === null || currentTurn !== turnRef.current || !userMessageId || !speechSessionRef.current) return;
    const userIndex = messages.findIndex((message) => message.id === userMessageId);
    if (userIndex < 0) return;
    const assistant = messages.slice(userIndex + 1).find((message) => message.role === "assistant");
    if (!assistant || typeof assistant.content !== "string") return;
    if (assistantMessageIdRef.current && assistantMessageIdRef.current !== assistant.id) return;
    assistantMessageIdRef.current = assistant.id;
    const partial = toSpokenText(assistant.content);
    if (!partial) return;
    setAnswer(partial);
    const pending = speechSessionRef.current;
    void pending.then((session) => {
      if (
        speechSessionRef.current === pending
        && requestTurnRef.current === currentTurn
        && turnRef.current === currentTurn
        && assistantMessageIdRef.current === assistant.id
      ) session.push(partial);
    });
  }, [isLoading, messages]);

  // Responsive orb sizing
  useEffect(() => {
    const fit = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setOrbSize(Math.round(Math.max(260, Math.min(440, vmin * 0.82))));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // A saved Realtime preference is scoped to the signed-in Pro account. A
  // guest, free account, signed-out browser, or a different account always
  // starts in private mode.
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/users/me", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (cancelled) return;
        const userId = Number(data?.id);
        const paid = data?.subscription?.isPaid === true
          && data?.isGuest !== true
          && Number.isSafeInteger(userId)
          && userId > 0;
        setIsPro(paid);
        setPreferenceUserId(paid ? userId : null);
        if (!paid) {
          setVoicePreference("private");
          return;
        }
        const stored = window.localStorage.getItem(voicePreferenceKey(userId));
        setVoicePreference(stored === REALTIME_CONSENT_VALUE ? "realtime" : "private");
      })
      .catch(() => {
        if (!cancelled) {
          setIsPro(false);
          setPreferenceUserId(null);
          setVoicePreference("private");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Invocation drift
  useEffect(() => {
    if (phase !== "resting") return;
    const id = setInterval(() => setInvI((i) => (i + 1) % INVITES.length), 6400);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      connectionAttemptRef.current += 1;
      voiceConnectAbortRef.current?.abort();
      voiceConnectAbortRef.current = null;
      connectingRef.current = false;
      activeRef.current = false;
      turnRef.current += 1;
      requestTurnRef.current = null;
      requestUserMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      clearRestartTimer();
      stop();
      transcriptionRef.current?.cancel();
      transcriptionRef.current = null;
      realtimeRef.current?.close();
      realtimeRef.current = null;
      cancelSpeechSession();
    };
  }, [cancelSpeechSession, clearRestartTimer, stop]);

  const submitTranscript = useCallback(async (transcript: LocalTranscript) => {
    const text = transcript.text.trim();
    transcriptionRef.current = null;
    if (!text || !activeRef.current) return;
    setLiveText(text);
    setAnswer("");
    setVoiceError("");
    setPhase("thinking");
    clearRestartTimer();
    cancelSpeechSession();
    const turnId = turnRef.current + 1;
    turnRef.current = turnId;
    requestTurnRef.current = turnId;
    const userMessageId = `voice-user-${turnId}-${Date.now()}`;
    requestUserMessageIdRef.current = userMessageId;
    assistantMessageIdRef.current = null;
    speechSessionRef.current = createStreamingTtsSession(
      lang === "ru" ? "ru-RU" : "en-US",
      0.9,
      () => {
        if (!activeRef.current || requestTurnRef.current !== turnId || turnRef.current !== turnId) return;
        setPhase("manifesting");
      },
    );
    try {
      await append({ id: userMessageId, role: "user", content: text });
    } catch (error) {
      if (requestTurnRef.current !== turnId || turnRef.current !== turnId) return;
      console.error("Could not request a voice reply", error);
      requestTurnRef.current = null;
      requestUserMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      cancelSpeechSession();
      setPhase("resting");
      setVoiceError(lang === "ru" ? "Мила не смогла ответить." : "Mila could not answer.");
    }
  }, [append, cancelSpeechSession, clearRestartTimer, lang]);

  const startListening = useCallback(async () => {
    if (!activeRef.current || transcriptionRef.current || listeningStartRef.current || loadingRef.current) return;
    listeningStartRef.current = true;
    setVoiceError("");
    setLiveText("");
    setAnswer("");
    setPhase("listening");
    try {
      const session = await startLocalTranscription({
        language: "auto",
        onScoring: () => setPhase("thinking"),
        onAutoStop: (transcript) => void submitTranscript(transcript),
        onError: (error) => {
          transcriptionRef.current = null;
          if (!activeRef.current || error.message === "cancelled") return;
          if (error.message === "no-speech" || error.message === "transcribe-empty") {
            setPhase("resting");
            scheduleListening(turnRef.current, 500);
            return;
          }
          if (error.message === "auth-required") {
            activeRef.current = false;
            setIsConnected(false);
            setVoiceError(freeMode
              ? (lang === "ru"
                  ? "Не удалось запустить бесплатную голосовую сессию. Обнови страницу и попробуй снова."
                  : "The free voice session could not start. Reload the page and try again.")
              : (lang === "ru"
                  ? "Войди в аккаунт, чтобы говорить с Милой голосом."
                  : "Sign in to talk with Mila by voice."));
            setPhase("resting");
            return;
          }
          setVoiceError(lang === "ru"
            ? "Не удалось распознать речь. Проверь микрофон и попробуй снова."
            : "I could not transcribe that. Check the microphone and try again.");
          setPhase("resting");
        },
      });
      if (!activeRef.current) {
        session.cancel();
        return;
      }
      transcriptionRef.current = session;
    } catch (error) {
      console.error("Could not start local voice transcription", error);
      activeRef.current = false;
      setIsConnected(false);
      setVoiceError(microphoneErrorMessage(error, lang === "ru" ? "ru" : "en"));
      setPhase("resting");
      throw error;
    } finally {
      listeningStartRef.current = false;
    }
  }, [freeMode, lang, scheduleListening, submitTranscript]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  /**
   * Optional Pro path: the OpenAI Realtime WebRTC loop. This function is only
   * called after the learner has explicitly consented to send microphone audio
   * to OpenAI, or has retained that account-scoped preference from an earlier
   * call. Throws when unreachable so the caller falls back to the private path.
   */
  const startRealtimeVoice = useCallback(async (connectionAttempt: number, signal: AbortSignal) => {
    const session = await connectRealtimeVoice({
      lang: lang === "ru" ? "ru" : "en",
      mode: kidsMode ? "kids" : freeMode ? "companion" : "tutor",
      signal,
      openAIAudioConsent: true,
      events: {
        onListening: () => {
          if (!activeRef.current || engineRef.current !== "realtime") return;
          setPhase("listening");
        },
        onUserTranscript: (text) => {
          if (!activeRef.current || engineRef.current !== "realtime") return;
          setLiveText(text);
        },
        onThinking: () => {
          if (!activeRef.current || engineRef.current !== "realtime") return;
          setAnswer("");
          setPhase("thinking");
        },
        onSpeaking: () => {
          if (!activeRef.current || engineRef.current !== "realtime") return;
          setPhase("manifesting");
        },
        onAssistantDelta: (fullText) => {
          if (!activeRef.current || engineRef.current !== "realtime") return;
          setAnswer(fullText);
        },
        onTurnComplete: ({ user, assistant }) => {
          // Voice Mila and text Mila share one memory: persist the spoken turn.
          void fetch("/api/chat/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, assistant, lang }),
          }).then((response) => {
            if (response.ok) announceCompanionHistoryUpdated();
          }).catch((error) => console.error("Could not persist the voice turn", error));
        },
        onServiceError: (error) => {
          // Non-fatal service event; the session usually recovers on its own.
          console.error("Realtime voice service error", error);
        },
        onDisconnect: () => {
          // Connection died mid-conversation: hand over to the private path.
          // Establishing/reusing the session first prevents the authenticated
          // chat endpoint from turning the fallback into a login dead-end.
          realtimeRef.current = null;
          if (!activeRef.current) return;
          void ensureGuestSession().then((seated) => {
            if (!activeRef.current) return;
            if (!seated) {
              activeRef.current = false;
              engineRef.current = null;
              setIsConnected(false);
              setPhase("resting");
              setVoiceError(lang === "ru"
                ? "Не удалось начать приватный голосовой сеанс. Попробуй ещё раз."
                : "I could not start a private voice session. Please try again.");
              return;
            }
            engineRef.current = "local";
            setPhase("resting");
            scheduleListening(turnRef.current, 200);
          });
        },
      },
    });
    if (!mountedRef.current || connectionAttemptRef.current !== connectionAttempt) {
      session.close();
      throw new Error("voice-connect-cancelled");
    }
    if (!session.isOpen()) {
      session.close();
      throw new Error("REALTIME_DISCONNECTED_DURING_SETUP");
    }
    realtimeRef.current = session;
    engineRef.current = "realtime";
    activeRef.current = true;
    setIsConnected(true);
    setVoiceError("");
    setPhase("listening");
  }, [freeMode, lang, scheduleListening]);

  const selectPrivateVoice = useCallback(() => {
    setShowRealtimeConsent(false);
    setVoicePreference("private");
    if (preferenceUserId) {
      window.localStorage.setItem(voicePreferenceKey(preferenceUserId), "private");
    }
  }, [preferenceUserId]);

  const confirmRealtimeVoice = useCallback(() => {
    if (!isPro || !preferenceUserId) return;
    window.localStorage.setItem(voicePreferenceKey(preferenceUserId), REALTIME_CONSENT_VALUE);
    setVoicePreference("realtime");
    setShowRealtimeConsent(false);
  }, [isPro, preferenceUserId]);

  const connectToVoice = async () => {
    if (isConnecting || connectingRef.current) return;

    // Must run synchronously inside the tap. If a later permission or network
    // await consumes Android's transient activation, the shared audio context
    // remains unlocked for local fallback and automatic following turns.
    primeMicrophoneAudioContext();

    // Flagship realtime session: tap only ever means "interrupt Mila" —
    // turn-taking itself is handled by voice (semantic VAD + barge-in).
    if (isConnected && engineRef.current === "realtime") {
      if (phase === "manifesting" || phase === "thinking") {
        realtimeRef.current?.interrupt();
        setAnswer("");
        setPhase("listening");
      }
      return;
    }

    const canInterruptGeneration = phase === "manifesting" || (phase === "thinking" && requestTurnRef.current !== null);
    if (isLoading && !canInterruptGeneration) return;

    if (isConnected) {
      if (canInterruptGeneration) {
        const nextTurn = turnRef.current + 1;
        turnRef.current = nextTurn;
        requestTurnRef.current = null;
        requestUserMessageIdRef.current = null;
        assistantMessageIdRef.current = null;
        stop();
        cancelSpeechSession();
        setPhase("resting");
        scheduleListening(nextTurn);
      } else if (phase === "listening" && transcriptionRef.current) {
        const session = transcriptionRef.current;
        transcriptionRef.current = null;
        try {
          await submitTranscript(await session.stop());
        } catch (error) {
          if (error instanceof Error && error.message !== "no-speech") console.error(error);
          setPhase("resting");
        }
      } else if (phase === "resting") {
        await startListening();
      }
      return;
    }

    const connectionAttempt = connectionAttemptRef.current + 1;
    connectionAttemptRef.current = connectionAttempt;
    const connectAbort = new AbortController();
    voiceConnectAbortRef.current?.abort();
    voiceConnectAbortRef.current = connectAbort;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      // Realtime for two audiences: a Pro user who chose it, AND the free
      // front-door companion (?free=1 → 'companion' mode, which is free — see
      // realtimeAccess.ts). The good voice is the whole point of the hook, so
      // the free companion tries it FIRST. If Realtime cannot connect (Russia /
      // no cloud reachable), we fall through to the private on-device path
      // below — the free companion still works with no VPN.
      if ((isPro && voicePreference === "realtime") || freeMode) {
        try {
          await startRealtimeVoice(connectionAttempt, connectAbort.signal);
          return;
        } catch (error) {
          console.info("Realtime voice unavailable, using the private voice path", error);
        }
        if (!mountedRef.current || connectionAttemptRef.current !== connectionAttempt) return;
      }

      const seated = await (freeMode
        ? (guestSessionRef.current ?? ensureGuestSession())
        : ensureGuestSession());
      if (freeMode) guestSessionRef.current = seated ? Promise.resolve(true) : null;
      if (!mountedRef.current || connectionAttemptRef.current !== connectionAttempt) return;
      if (!seated) {
        setVoiceError(lang === "ru"
          ? "Не удалось начать приватный голосовой сеанс. Попробуй ещё раз."
          : "I could not start a private voice session. Please try again.");
        setPhase("resting");
        return;
      }

      activeRef.current = true;
      engineRef.current = "local";
      setIsConnected(true);
      try {
        await startListening();
      } catch {
        // startListening exposes a useful in-page error and resets the connection.
      }
    } finally {
      if (voiceConnectAbortRef.current === connectAbort) voiceConnectAbortRef.current = null;
      if (connectionAttemptRef.current === connectionAttempt) {
        connectingRef.current = false;
        if (mountedRef.current) setIsConnecting(false);
      }
    }
  };

  const exit = useCallback(() => {
    connectionAttemptRef.current += 1;
    voiceConnectAbortRef.current?.abort();
    voiceConnectAbortRef.current = null;
    connectingRef.current = false;
    activeRef.current = false;
    turnRef.current += 1;
    requestTurnRef.current = null;
    requestUserMessageIdRef.current = null;
    assistantMessageIdRef.current = null;
    clearRestartTimer();
    stop();
    transcriptionRef.current?.cancel();
    transcriptionRef.current = null;
    realtimeRef.current?.close();
    realtimeRef.current = null;
    engineRef.current = null;
    cancelSpeechSession();
    setIsConnected(false);
    setIsConnecting(false);
    router.push('/chat');
  }, [cancelSpeechSession, clearRestartTimer, router, stop]);

  const showInvocation = phase === "resting";
  const showQuestion = (phase === "listening" || phase === "thinking") && !!liveText;

  return (
    <div className="voice-stage fixed inset-0 overflow-hidden" data-phase={phase}>
      <MilaAurora phase={phase} />

      <button
        onClick={exit}
        aria-label="Leave the voice room"
        className="voice-exit absolute z-30 p-2.5 transition-colors"
        style={{
          top: "max(1.1rem, env(safe-area-inset-top, 0px))",
          right: "max(1.1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>

      {!freeMode && (
      <div
        className="absolute left-4 top-4 z-30 flex max-w-[calc(100%-5.5rem)] items-center gap-1 rounded-xl border border-black/10 bg-white/90 p-1 text-[11px] shadow-sm backdrop-blur"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
        aria-label="Voice privacy mode"
      >
        <span className="px-2 text-slate-600">
          {lang === "ru" ? "Режим голоса" : "Voice mode"}
        </span>
        <button
          type="button"
          className={`rounded-lg px-2.5 py-1.5 font-semibold transition ${voicePreference === "private" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          aria-pressed={voicePreference === "private"}
          disabled={isConnected}
          onClick={selectPrivateVoice}
          title={lang === "ru" ? "Аудио микрофона не отправляется в OpenAI" : "Microphone audio is not sent to OpenAI"}
        >
          {lang === "ru" ? "Приватный" : "Private"}
        </button>
        {isPro && (
          <button
            type="button"
            className={`rounded-lg px-2.5 py-1.5 font-semibold transition ${voicePreference === "realtime" ? "bg-pink-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            aria-pressed={voicePreference === "realtime"}
            disabled={isConnected}
            onClick={() => setShowRealtimeConsent(true)}
          >
            {lang === "ru" ? "Быстрый Pro" : "Fast Pro"}
          </button>
        )}
      </div>
      )}

      {showRealtimeConsent && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/45 p-5" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="realtime-consent-title"
            aria-describedby="realtime-consent-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-pink-700">Mila Pro</p>
            <h2 id="realtime-consent-title" className="mb-3 text-xl font-semibold">
              {lang === "ru" ? "Включить быстрый голос?" : "Use fast live voice?"}
            </h2>
            <p id="realtime-consent-description" className="mb-6 text-sm leading-6 text-slate-600">
              {lang === "ru"
                ? "В быстром режиме звук с микрофона и расшифровка отправляются в OpenAI для обработки разговора в реальном времени. Выбирай этот режим, только если согласен. Настройка сохранится для этого аккаунта; перед звонком всегда можно вернуться в приватный режим."
                : "Fast mode sends your microphone audio and transcript to OpenAI for live processing. Choose it only if you consent. This preference is saved for this account, and you can switch back to Private before any call."}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800"
                onClick={selectPrivateVoice}
              >
                {lang === "ru" ? "Оставить приватный" : "Keep private"}
              </button>
              <button
                type="button"
                className="rounded-xl bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white"
                onClick={confirmRealtimeVoice}
              >
                {lang === "ru" ? "Согласен — включить" : "I agree — use fast voice"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* The orb — edgeless, centered, the touch target */}
      <button
        type="button"
        onClick={connectToVoice}
        aria-label={!isConnected ? "Touch to begin" : phase === "manifesting" ? "Interrupt" : "Speak or stop recording"}
        className="voice-orb absolute left-1/2 z-10 outline-none"
        style={{ top: "42%", transform: "translate(-50%, -50%)", background: "transparent", border: "none", cursor: "pointer" }}
      >
        {/* Wordless invitation — a ripple of light that says: touch me */}
        {showInvocation && !isConnected && !isConnecting && (
          <span className="voice-ripplewrap" aria-hidden="true">
            <span className="voice-ripple" />
            <span className="voice-ripple voice-ripple--delay" />
          </span>
        )}

        {isConnecting && (
           <div className="voice-connecting absolute inset-0 rounded-full border-2 border-t-transparent animate-spin z-20 pointer-events-none" style={{ width: orbSize, height: orbSize, left: '50%', top: '50%', marginLeft: -orbSize/2, marginTop: -orbSize/2 }}></div>
        )}

        {kidsMode ? <MilaKid state={phase} size={orbSize} /> : <MilaOrb state={phase} size={orbSize} />}
      </button>

      {/* The invitation the orb breathes at rest */}
      {(!isConnected && !isConnecting) && (
        <div className="voice-invoke" data-show={showInvocation ? "1" : "0"} aria-live="polite">
          <strong>{lang === "ru" ? "Нажми, чтобы поговорить с Милой" : "Tap to talk with Mila"}</strong>
          <span key={invI} className="voice-invoke-line">{INVITES[invI % INVITES.length]}</span>
        </div>
      )}

      {/* The seeker's question — rises, then collapses into the flame */}
      <div className={`voice-q ${showQuestion ? "is-on" : ""} ${phase === "thinking" ? "is-suck" : ""}`} aria-live="polite">
        {liveText}
      </div>

      {/* The AI's answer — emerges from the mineral field (and is spoken) */}
      {phase === "manifesting" && answer && (
        <>
          <div className="voice-ascrim" aria-hidden="true" />
          <div className="voice-a" aria-live="polite">
            {answer.split(" ").map((w, i) => (
              <span key={i} className={`voice-aword${i === 0 ? " is-init" : ""}`} style={{ animationDelay: `${Math.min(i * 0.09, 3)}s` }}>
                {w}{" "}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Status */}
      {isConnected && (
        <div
          className="absolute bottom-[8%] left-1/2 z-20 w-[90%] max-w-md -translate-x-1/2"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          aria-live="polite"
        >
          <p className="text-center text-[11px] tracking-[0.1em] uppercase mb-2 transition-colors duration-300">
            {phase === "listening" ? (
              <span className="voice-status voice-status--listening">● Hearing you</span>
            ) : phase === "thinking" ? (
              <span className="voice-status voice-status--thinking">Reflecting…</span>
            ) : phase === "manifesting" ? (
              <span className="voice-status voice-status--speaking">Speaking — tap to interrupt</span>
            ) : (
              <span className="voice-status voice-status--resting">Speak to start</span>
            )}
          </p>
        </div>
      )}

      {voiceError && (
        <p className="voice-error absolute bottom-[3%] left-1/2 z-20 w-[90%] max-w-md -translate-x-1/2 text-center text-xs" role="alert">
          {voiceError}
        </p>
      )}
    </div>
  );
}
