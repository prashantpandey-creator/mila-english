"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MilaAurora } from "@/components/voice/MilaAurora";
import type { OrbState } from "@/components/voice/MilaOrb";
import { MilaPresence } from "@/components/voice/MilaPresence";
import { PresencePicker } from "@/components/voice/PresencePicker";
import { useI18n } from "@/lib/i18n-provider";
import { connectRealtimeVoice, type RealtimeVoiceSession } from "@/lib/realtimeVoice";
import { primeMicrophoneAudioContext } from "@/lib/microphone";
import {
  isPresenceId,
  normalizePresenceId,
  PRESENCE_STORAGE_KEY,
  type PresenceId,
} from "@/lib/presences";
import { decideVoiceLaunch, hasLiveVoiceAccess } from "@/lib/voiceSurfacePolicy";
import { announceCompanionHistoryUpdated } from "@/lib/use-companion-history";

const INVITES = [
  "What do you wish to know?",
  "Bring your question.",
  "Ask, and the AI will answer.",
  "Even silence is heard.",
  "What do you seek?",
];

type VoicePreference = "idle" | "realtime";

const REALTIME_CONSENT_VALUE = "realtime-consent-v1";

function voicePreferenceKey(userId: number): string {
  return `mila-voice-preference-v1:${userId}`;
}

export default function VoicePage() {
  const router = useRouter();
  const { lang } = useI18n();

  const [phase, setPhase] = useState<OrbState>("resting");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voicePreference, setVoicePreference] = useState<VoicePreference>("idle");
  const [preferenceUserId, setPreferenceUserId] = useState<number | null>(null);
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);
  const [routeModeReady, setRouteModeReady] = useState(false);
  const [freePreview, setFreePreview] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [previewAvailable, setPreviewAvailable] = useState(false);
  const [showRealtimeConsent, setShowRealtimeConsent] = useState(false);

  const [liveText, setLiveText] = useState("");
  const [answer, setAnswer] = useState("");
  const [invI, setInvI] = useState(0);
  const [orbSize, setOrbSize] = useState(320);
  // Presence changes only Mila's visual window. It never selects an LLM,
  // conversation style, or adult mode. Every option is a fictional AI avatar.
  const [presenceId, setPresenceId] = useState<PresenceId>("signal");

  const realtimeRef = useRef<RealtimeVoiceSession | null>(null);
  const engineRef = useRef<"realtime" | null>(null);
  const connectingRef = useRef(false);
  const activeRef = useRef(false);
  const mountedRef = useRef(false);
  const connectionAttemptRef = useRef(0);
  const voiceConnectAbortRef = useRef<AbortController | null>(null);

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

  // Query params are a QA override; ordinary users keep a device-local visual
  // preference. The retired ?face=1 flag maps to the original fictional Ember
  // portrait instead of restoring an unlicensed or real-person likeness.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("presence");
    const stored = window.localStorage.getItem(PRESENCE_STORAGE_KEY);
    const next = isPresenceId(requested)
      ? requested
      : params.get("face") === "1"
        ? "ember"
        : normalizePresenceId(stored);
    setPresenceId(next);
    setFreePreview(params.get("free") === "1");
    setRouteModeReady(true);
  }, []);

  // A saved Realtime choice is scoped to a signed-in Pro account. The free
  // front-door preview always asks again before sending microphone audio to
  // OpenAI. The unfinished private/local mode is intentionally not exposed.
  useEffect(() => {
    if (!routeModeReady) return;
    let cancelled = false;
    setPreferenceLoaded(false);

    void (async () => {
      const response = await fetch("/api/users/me", { cache: "no-store" });
      const data = response.ok ? await response.json() : null;
      if (cancelled) return;

      const userId = Number(data?.id);
      const hasIdentity = Number.isSafeInteger(userId) && userId > 0;
      const paid = hasIdentity
        && data?.isGuest !== true
        && data?.subscription?.isPaid === true;
      const available = hasIdentity && data?.liveVoicePreviewAvailable === true;

      setIsPro(paid);
      setPreviewAvailable(available);
      setPreferenceUserId(hasIdentity ? userId : null);
      if (!hasIdentity || !paid) {
        setVoicePreference("idle");
        return;
      }

      const stored = window.localStorage.getItem(voicePreferenceKey(userId));
      setVoicePreference(stored === REALTIME_CONSENT_VALUE ? "realtime" : "idle");
    })()
      .catch(() => {
        if (cancelled) return;
        setIsPro(false);
        setPreviewAvailable(false);
        setPreferenceUserId(null);
        setVoicePreference("idle");
      })
      .finally(() => {
        if (!cancelled) setPreferenceLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [routeModeReady]);

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
      realtimeRef.current?.close();
      realtimeRef.current = null;
    };
  }, []);

  /**
   * Optional Pro path: the OpenAI Realtime WebRTC loop. This function is only
   * called after the learner has explicitly consented to send microphone audio
   * to OpenAI, or has retained that account-scoped preference from an earlier
   * call. The unfinished private/local path is not a runtime fallback.
   */
  const startRealtimeVoice = useCallback(async (connectionAttempt: number, signal: AbortSignal) => {
    const session = await connectRealtimeVoice({
      lang: lang === "ru" ? "ru" : "en",
      mode: freePreview && !isPro ? "companion" : "tutor",
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
          realtimeRef.current = null;
          if (!activeRef.current) return;
          activeRef.current = false;
          engineRef.current = null;
          setIsConnected(false);
          setPhase("resting");
          setVoiceError(lang === "ru"
            ? "Связь Live прервалась. Попробуй ещё раз."
            : "Live voice disconnected. Please try again.");
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
  }, [freePreview, isPro, lang]);

  const beginLiveConnection = useCallback(async () => {
    if (isConnecting || connectingRef.current) return;

    // Run inside the initiating tap—either the consent button or a later avatar
    // tap—so Android can unlock audio before the network request begins.
    primeMicrophoneAudioContext();

    if (isConnected && engineRef.current === "realtime") {
      if (phase === "manifesting" || phase === "thinking") {
        realtimeRef.current?.interrupt();
        setAnswer("");
        setPhase("listening");
      }
      return;
    }

    if (isConnected) return;

    const connectionAttempt = connectionAttemptRef.current + 1;
    connectionAttemptRef.current = connectionAttempt;
    const connectAbort = new AbortController();
    voiceConnectAbortRef.current?.abort();
    voiceConnectAbortRef.current = connectAbort;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      try {
        await startRealtimeVoice(connectionAttempt, connectAbort.signal);
      } catch (error) {
        console.info("Realtime voice unavailable", error);
        if (!mountedRef.current || connectionAttemptRef.current !== connectionAttempt) return;
        activeRef.current = false;
        engineRef.current = null;
        setIsConnected(false);
        setPhase("resting");
        setVoiceError(lang === "ru"
          ? "Не удалось запустить Live-голос. Попробуй ещё раз позже."
          : "Live voice could not start. Please try again later.");
      }
    } finally {
      if (voiceConnectAbortRef.current === connectAbort) voiceConnectAbortRef.current = null;
      if (connectionAttemptRef.current === connectionAttempt) {
        connectingRef.current = false;
        if (mountedRef.current) setIsConnecting(false);
      }
    }
  }, [isConnected, isConnecting, lang, phase, startRealtimeVoice]);

  const cancelRealtimeConsent = useCallback(() => {
    setShowRealtimeConsent(false);
    setVoicePreference("idle");
  }, []);

  const confirmRealtimeVoice = useCallback(() => {
    const isPreview = freePreview && !isPro;
    if (!preferenceLoaded || (!isPreview && !preferenceUserId)) return;
    if (!isPreview && preferenceUserId) {
      window.localStorage.setItem(voicePreferenceKey(preferenceUserId), REALTIME_CONSENT_VALUE);
    }
    setVoicePreference("realtime");
    setShowRealtimeConsent(false);
    void beginLiveConnection();
  }, [beginLiveConnection, freePreview, isPro, preferenceLoaded, preferenceUserId]);

  const isLivePreview = freePreview && !isPro;
  const canUseLiveVoice = hasLiveVoiceAccess({
    isPro,
    freePreview: isLivePreview,
    previewAvailable,
  });

  const connectToVoice = async () => {
    const launchDecision = decideVoiceLaunch({
      preferenceLoaded,
      isConnecting: isConnecting || connectingRef.current,
      hasLiveAccess: canUseLiveVoice,
      hasLiveConsent: voicePreference === "realtime",
    });

    if (launchDecision === "blocked") return;

    if (launchDecision === "unavailable") {
      setVoiceError(lang === "ru"
        ? "Live-голос пока недоступен для этого аккаунта. Продолжи в текстовом чате."
        : "Live voice is not available for this account yet. Continue in text chat.");
      return;
    }

    if (launchDecision === "request-live-consent") {
      setShowRealtimeConsent(true);
      return;
    }

    await beginLiveConnection();
  };

  const exit = useCallback(() => {
    connectionAttemptRef.current += 1;
    voiceConnectAbortRef.current?.abort();
    voiceConnectAbortRef.current = null;
    connectingRef.current = false;
    activeRef.current = false;
    realtimeRef.current?.close();
    realtimeRef.current = null;
    engineRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    router.push('/chat');
  }, [router]);

  const choosePresence = useCallback((next: PresenceId) => {
    setPresenceId(next);
    window.localStorage.setItem(PRESENCE_STORAGE_KEY, next);
  }, []);

  const showInvocation = phase === "resting";
  const showQuestion = (phase === "listening" || phase === "thinking") && !!liveText;
  const systemState = phase === "resting"
    ? "STANDBY"
    : phase === "listening"
      ? "LISTENING"
      : phase === "thinking"
        ? "PROCESSING"
        : "TRANSMITTING";

  return (
    <div className="voice-stage fixed inset-0 overflow-hidden" data-phase={phase}>
      <MilaAurora phase={phase} variant="synthetic" />

      <div className="voice-chamber-ui" aria-hidden="true">
        <div className="voice-chamber-ui__brand">
          <span>MILA // COMPANION NODE</span>
          <strong>SYNTHETIC PRESENCE</strong>
        </div>
        <div className="voice-chamber-ui__state">
          <span>VOICE LINK</span>
          <strong>{systemState}</strong>
        </div>
        <span className="voice-chamber-ui__corner voice-chamber-ui__corner--tl" />
        <span className="voice-chamber-ui__corner voice-chamber-ui__corner--tr" />
        <span className="voice-chamber-ui__corner voice-chamber-ui__corner--bl" />
        <span className="voice-chamber-ui__corner voice-chamber-ui__corner--br" />
      </div>

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

      {!isConnected && !isConnecting ? (
        <PresencePicker value={presenceId} lang={lang} onChange={choosePresence} />
      ) : null}

      <p className="presence-ai-disclosure">
        {lang === "ru" ? "ИИ-персонаж · синтетический образ и голос" : "AI character · synthetic image and voice"}
      </p>

      {showRealtimeConsent && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/45 p-5" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="realtime-consent-title"
            aria-describedby="realtime-consent-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-pink-700">
              {isLivePreview ? "Mila live preview" : "Mila Pro · live voice"}
            </p>
            <h2 id="realtime-consent-title" className="mb-3 text-xl font-semibold">
              {lang === "ru" ? "Начать живой разговор?" : "Start live voice?"}
            </h2>
            <p id="realtime-consent-description" className="mb-6 text-sm leading-6 text-slate-600">
              {isLivePreview
                ? (lang === "ru"
                    ? "Для этого демо звук с микрофона и расшифровка будут отправлены в OpenAI, чтобы провести разговор в реальном времени. Согласие действует только для текущего посещения; можно отменить и продолжить в текстовом чате."
                    : "For this preview, your microphone audio and transcript will be sent to OpenAI to run the live conversation. Your choice applies only to this visit; you can cancel and continue in text chat.")
                : (lang === "ru"
                    ? "В Live-режиме звук с микрофона и расшифровка отправляются в OpenAI для разговора в реальном времени. Выбирай его, только если согласен. Настройка сохранится для этого Pro-аккаунта; можно отменить и продолжить в текстовом чате."
                    : "Live mode sends your microphone audio and transcript to OpenAI for real-time conversation. Choose it only if you consent. This preference is saved for this Pro account; you can cancel and continue in text chat.")}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800"
                onClick={cancelRealtimeConsent}
              >
                {lang === "ru" ? "Не сейчас" : "Not now"}
              </button>
              <button
                type="button"
                className="rounded-xl bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white"
                disabled={!preferenceLoaded}
                onClick={confirmRealtimeVoice}
              >
                {lang === "ru" ? "Согласен — включить Live" : "I agree — enable Live"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* The orb — edgeless, centered, the touch target */}
      <button
        type="button"
        onClick={connectToVoice}
        disabled={!preferenceLoaded || !canUseLiveVoice}
        aria-label={!canUseLiveVoice ? "Live voice unavailable" : !isConnected ? "Start live voice" : phase === "manifesting" ? "Interrupt" : "Speak"}
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

        <MilaPresence presenceId={presenceId} state={phase} size={orbSize} />
      </button>

      {/* The invitation the orb breathes at rest */}
      {(!isConnected && !isConnecting) && (
        <div className="voice-invoke" data-show={showInvocation ? "1" : "0"} aria-live="polite">
          <strong>
            {canUseLiveVoice
              ? (lang === "ru" ? "Нажми, чтобы начать Live с Милой" : "Tap to start Live with Mila")
              : (lang === "ru" ? "Live-голос пока недоступен" : "Live voice is not available yet")}
          </strong>
          <span key={invI} className="voice-invoke-line">
            {canUseLiveVoice
              ? INVITES[invI % INVITES.length]
              : (lang === "ru" ? "Продолжи в текстовом чате" : "Continue in text chat")}
          </span>
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
