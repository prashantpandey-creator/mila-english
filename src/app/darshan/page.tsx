"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "ai/react";
import { useRouter } from "next/navigation";
import { MilaAurora } from "@/components/voice/MilaAurora";
import { MilaOrb, type OrbState } from "@/components/voice/MilaOrb";
import { useI18n } from "@/lib/i18n-provider";
import { startLocalTranscription, type LocalTranscript, type TranscriptionSession } from "@/lib/localTranscription";
import { connectRealtimeVoice, type RealtimeVoiceSession } from "@/lib/realtimeVoice";
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

  const [liveText, setLiveText] = useState("");
  const [answer, setAnswer] = useState("");
  const [invI, setInvI] = useState(0);
  const [orbSize, setOrbSize] = useState(320);
  // Free front-door companion (?free=1): the playful, guest-open general chat,
  // not the lesson coach. Read once on mount.
  const [freeMode] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("free") === "1");

  const transcriptionRef = useRef<TranscriptionSession | null>(null);
  const realtimeRef = useRef<RealtimeVoiceSession | null>(null);
  const engineRef = useRef<"realtime" | "local" | null>(null);
  const speechSessionRef = useRef<Promise<StreamingTtsSession> | null>(null);
  const listeningStartRef = useRef(false);
  const loadingRef = useRef(false);
  const turnRef = useRef(0);
  const requestTurnRef = useRef<number | null>(null);
  const requestUserMessageIdRef = useRef<string | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});

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
    body: { context: { pathname: "/darshan", lang, surface: "voice" } },
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

  // Invocation drift
  useEffect(() => {
    if (phase !== "resting") return;
    const id = setInterval(() => setInvI((i) => (i + 1) % INVITES.length), 6400);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    return () => {
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
      setVoiceError(lang === "ru"
        ? "Нет доступа к микрофону или локальному распознаванию речи."
        : "Microphone access or local speech recognition is unavailable.");
      setPhase("resting");
      throw error;
    } finally {
      listeningStartRef.current = false;
    }
  }, [lang, scheduleListening, submitTranscript]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  /**
   * Flagship path: the same OpenAI Realtime WebRTC loop that powers the voice
   * assessment, in tutor mode. Full duplex — the mic stays open, Mila can be
   * interrupted by voice, and turns are persisted to the shared companion
   * history. Throws when unreachable so the caller falls back to the local
   * cascade without the learner noticing anything except a slower Mila.
   */
  const startRealtimeVoice = useCallback(async () => {
    const session = await connectRealtimeVoice({
      lang: lang === "ru" ? "ru" : "en",
      mode: freeMode ? "companion" : "tutor",
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
          // Free guests aren't signed in and keep no history; only the
          // logged-in coach persists turns to the shared companion memory.
          if (freeMode) return;
          // Voice Mila and text Mila share one memory: persist the spoken turn.
          void fetch("/api/chat/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, assistant, pathname: "/darshan", lang }),
          }).then((response) => {
            if (response.ok) announceCompanionHistoryUpdated();
          }).catch((error) => console.error("Could not persist the voice turn", error));
        },
        onServiceError: (error) => {
          // Non-fatal service event; the session usually recovers on its own.
          console.error("Realtime voice service error", error);
        },
        onDisconnect: () => {
          // Connection died mid-conversation: silently hand over to the local
          // cascade so Mila gets slower, never dead.
          realtimeRef.current = null;
          if (!activeRef.current) return;
          engineRef.current = "local";
          setPhase("resting");
          scheduleListening(turnRef.current, 200);
        },
      },
    });
    realtimeRef.current = session;
    engineRef.current = "realtime";
    activeRef.current = true;
    setIsConnected(true);
    setVoiceError("");
    setPhase("listening");
  }, [lang, scheduleListening, freeMode]);

  const connectToVoice = async () => {
    if (isConnecting) return;

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

    setIsConnecting(true);
    try {
      // Perfect voice first: OpenAI Realtime wherever it can reach.
      await startRealtimeVoice();
      return;
    } catch (error) {
      // Region, network, or configuration — the local cascade is the net.
      console.info("Realtime voice unavailable, using the local voice path", error);
    } finally {
      setIsConnecting(false);
    }

    setIsConnecting(true);
    activeRef.current = true;
    engineRef.current = "local";
    setIsConnected(true);
    try {
      await startListening();
    } catch {
      // startListening exposes a useful in-page error and resets the connection.
    } finally {
      setIsConnecting(false);
    }
  };

  const exit = useCallback(() => {
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
    router.push('/chat');
  }, [cancelSpeechSession, clearRestartTimer, router, stop]);

  const showInvocation = phase === "resting";
  const showQuestion = (phase === "listening" || phase === "thinking") && !!liveText;

  return (
    <div className="voice-stage fixed inset-0 overflow-hidden bg-black">
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
           <div className="absolute inset-0 rounded-full border-2 border-pink-500/50 border-t-transparent animate-spin z-20 pointer-events-none" style={{ width: orbSize, height: orbSize, left: '50%', top: '50%', marginLeft: -orbSize/2, marginTop: -orbSize/2 }}></div>
        )}

        <MilaOrb state={phase} size={orbSize} />
      </button>

      {/* The invitation the orb breathes at rest */}
      {(!isConnected && !isConnecting) && (
        <div className="voice-invoke" data-show={showInvocation ? "1" : "0"} aria-live="polite">
          <span key={invI} className="voice-invoke-line">{INVITES[invI % INVITES.length]}</span>
        </div>
      )}

      {/* The seeker's question — rises, then collapses into the flame */}
      <div className={`voice-q ${showQuestion ? "is-on" : ""} ${phase === "thinking" ? "is-suck" : ""}`} aria-live="polite">
        {liveText}
      </div>

      {/* The AI's answer — emerges from the flame in pink/white (and is spoken) */}
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
              <span className="text-pink-400">● Hearing you</span>
            ) : phase === "thinking" ? (
              <span className="text-purple-400">Reflecting…</span>
            ) : phase === "manifesting" ? (
              <span className="text-pink-300">Speaking — tap to interrupt</span>
            ) : (
              <span className="text-pink-200/50">Speak to start</span>
            )}
          </p>
        </div>
      )}

      {voiceError && (
        <p className="absolute bottom-[3%] left-1/2 z-20 w-[90%] max-w-md -translate-x-1/2 text-center text-xs text-rose-200" role="alert">
          {voiceError}
        </p>
      )}
    </div>
  );
}
