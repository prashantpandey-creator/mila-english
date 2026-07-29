"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MilaAurora } from "@/components/voice/MilaAurora";
import type { OrbState } from "@/components/voice/MilaOrb";
import { MilaPresence } from "@/components/voice/MilaPresence";
import { PresencePortraitDialog } from "@/components/voice/PresencePortraitDialog";
import { PresencePicker } from "@/components/voice/PresencePicker";
import MilaIcon from "@/components/ui/MilaIcon";
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
import { GIA_LIVE_FREE_LAUNCH } from "@/lib/giaAccess";
import { announceCompanionHistoryUpdated } from "@/lib/use-companion-history";
import {
  appendGiaGuestVoiceTurn,
  createGiaGuestVoiceHandoffToken,
} from "@/lib/giaGuestHandoff";
import {
  createGiaVoiceTabCoordinator,
  type GiaVoiceTabCoordinator,
} from "@/lib/giaVoiceTabCoordinator";

const INVITES = {
  en: [
    "What’s on your mind?",
    "Tell me how your day is going.",
    "We can talk about anything.",
    "Take your time. I’m listening.",
    "Where should we begin?",
  ],
  ru: [
    "О чём думаешь?",
    "Расскажи, как проходит твой день.",
    "Можем поговорить о чём угодно.",
    "Не спеши. Я слушаю.",
    "С чего начнём?",
  ],
} as const;

type VoicePreference = "idle" | "realtime";

const REALTIME_CONSENT_VALUE = "realtime-consent-v1";

function voicePreferenceKey(userId: number): string {
  return `mila-voice-preference-v1:${userId}`;
}

function voiceConnectionErrorMessage(problem: unknown, lang: "en" | "ru"): string {
  const code = problem instanceof Error ? problem.message : "";
  const ru = lang === "ru";
  switch (code) {
    case "permission-denied":
      return ru
        ? "Микрофон заблокирован. Разреши доступ к нему в настройках браузера и попробуй снова."
        : "Microphone access is blocked. Allow it in your browser settings, then try again.";
    case "no-microphone":
      return ru
        ? "Доступный микрофон не найден. Проверь устройство и попробуй снова."
        : "No available microphone was found. Check your device, then try again.";
    case "microphone-busy":
      return ru
        ? "Микрофон занят другим приложением. Заверши звонок или запись и попробуй снова."
        : "Another app is using your microphone. End the call or recording, then try again.";
    case "microphone-constraints":
      return ru
        ? "Браузер не смог открыть микрофон с настройками этого устройства. Попробуй ещё раз."
        : "The browser could not open the microphone with this device setup. Please try again.";
    case "audio-context-suspended":
      return ru
        ? "Браузер приостановил аудиовход. Нажми «Попробовать снова», чтобы запустить его."
        : "Your browser paused audio input. Choose “Try again” to start it.";
    case "microphone-start-failed":
      return ru
        ? "Не удалось запустить микрофон. Перезагрузи страницу или продолжи в текстовом чате."
        : "The microphone could not start. Reload the page or continue in text chat.";
    case "unsupported":
    case "insecure-context":
    case "recorder-unsupported":
      return ru
        ? "Этот браузер не поддерживает защищённый Live-голос. Открой Gia в актуальном браузере по HTTPS."
        : "This browser cannot run secure Live voice. Open Gia over HTTPS in a current browser.";
    case "RATE_LIMITED":
      return ru
        ? "Слишком много попыток подряд. Подожди немного или продолжи в текстовом чате."
        : "There have been too many attempts. Wait a moment or continue in text chat.";
    case "VOICE_PREVIEW_USED":
    case "VOICE_PAID_FEATURE":
      return ru
        ? "Бесплатный Gia Live не запустился. Попробуй ещё раз или продолжи в текстовом чате."
        : "Free Gia Live did not start. Try again or continue in text chat.";
    case "UNAUTHORIZED":
      return ru
        ? "Войди в аккаунт, чтобы запустить Live-голос, или продолжи в текстовом чате."
        : "Sign in to start Live voice, or continue in text chat.";
    default:
      return ru
        ? "Не удалось подключить Live-голос. Проверь сеть и попробуй снова."
        : "Live voice could not connect. Check your network, then try again.";
  }
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
  const [isPro, setIsPro] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [hasIdentity, setHasIdentity] = useState(false);
  const [accessCheckFailed, setAccessCheckFailed] = useState(false);
  const [showRealtimeConsent, setShowRealtimeConsent] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [otherVoiceTabActive, setOtherVoiceTabActive] = useState(false);

  const [liveText, setLiveText] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerAnnouncement, setAnswerAnnouncement] = useState("");
  const [invI, setInvI] = useState(0);
  const [orbSize, setOrbSize] = useState(320);
  // Presence changes only Gia's visual window. It never selects an LLM,
  // conversation style, or adult mode. Every option is a fictional AI avatar.
  const [presenceId, setPresenceId] = useState<PresenceId>("signal");
  const [showPortrait, setShowPortrait] = useState(false);

  const realtimeRef = useRef<RealtimeVoiceSession | null>(null);
  const engineRef = useRef<"realtime" | null>(null);
  const connectingRef = useRef(false);
  const activeRef = useRef(false);
  const mountedRef = useRef(false);
  const connectionAttemptRef = useRef(0);
  const voiceConnectAbortRef = useRef<AbortController | null>(null);
  const voiceOrbRef = useRef<HTMLButtonElement>(null);
  const consentCancelRef = useRef<HTMLButtonElement>(null);
  const consentConfirmRef = useRef<HTMLButtonElement>(null);
  const guestVoiceHandoffTokenRef = useRef<string | null>(null);
  const voiceTabCoordinatorRef = useRef<GiaVoiceTabCoordinator | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  // Responsive orb sizing
  useEffect(() => {
    const fit = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      const heightBudget = window.innerHeight - (window.innerHeight < 520 ? 190 : 200);
      setOrbSize(Math.round(Math.max(160, Math.min(440, vmin * 0.82, heightBudget))));
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
    setRouteModeReady(true);
  }, []);

  // A saved Realtime choice remains scoped to a signed-in Pro account. During
  // Gia's free-first launch, free visitors consent again each visit before any
  // microphone audio is sent to OpenAI.
  useEffect(() => {
    if (!routeModeReady) return;
    let cancelled = false;
    setPreferenceLoaded(false);
    setAccessCheckFailed(false);

    void (async () => {
      const response = await fetch("/api/users/me", { cache: "no-store" });
      const data = response.ok ? await response.json() : null;
      if (cancelled) return;

      const userId = Number(data?.id);
      const hasIdentity = Number.isSafeInteger(userId) && userId > 0;
      const paid = hasIdentity
        && data?.isGuest !== true
        && data?.subscription?.isPaid === true;

      setIsPro(paid);
      setIsGuest(data?.isGuest === true);
      setHasIdentity(hasIdentity);
      setAccessCheckFailed(false);
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
        setIsGuest(false);
        setHasIdentity(false);
        setAccessCheckFailed(true);
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
    const id = setInterval(() => setInvI((i) => (i + 1) % INVITES[lang].length), 6400);
    return () => clearInterval(id);
  }, [lang, phase]);

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
      voiceTabCoordinatorRef.current?.release();
    };
  }, []);

  // Gia is deliberately silent outside the foreground tab. A short-lived
  // device-local lease also prevents two copies of Gia from opening the
  // microphone at once.
  useEffect(() => {
    const stopForAnotherTab = () => {
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
      setIsVoicePaused(false);
      setPhase("resting");
      setLiveText("");
      setAnswer("");
      setVoiceError("");
      setOtherVoiceTabActive(true);
    };

    const coordinator = createGiaVoiceTabCoordinator({
      onOwnershipLost: stopForAnotherTab,
      onOtherOwnerChange: setOtherVoiceTabActive,
    });
    voiceTabCoordinatorRef.current = coordinator;
    setOtherVoiceTabActive(coordinator.hasOtherOwner());

    const pauseActiveVoice = () => {
      const session = realtimeRef.current;
      if (!activeRef.current || !session?.isOpen() || session.isSuspended()) return;
      session.suspend();
      setIsVoicePaused(true);
      setPhase("resting");
      setLiveText("");
      setAnswer("");
      setAnswerAnnouncement("");
    };

    const handleForeground = () => {
      coordinator.refresh();
      if (
        realtimeRef.current?.isOpen()
        && (!coordinator.isOwner() || coordinator.hasOtherOwner())
      ) {
        stopForAnotherTab();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (connectingRef.current) {
          connectionAttemptRef.current += 1;
          voiceConnectAbortRef.current?.abort();
          voiceConnectAbortRef.current = null;
          connectingRef.current = false;
          coordinator.release();
          setIsConnecting(false);
          setPhase("resting");
          setVoiceError(langRef.current === "ru"
            ? "Подключение остановлено при смене вкладки. Нажми на Джиа, чтобы попробовать снова."
            : "Voice setup paused when you switched tabs. Tap Gia to try again.");
        }
        pauseActiveVoice();
        return;
      }
      handleForeground();
    };

    const handlePageHide = () => {
      connectionAttemptRef.current += 1;
      voiceConnectAbortRef.current?.abort();
      voiceConnectAbortRef.current = null;
      connectingRef.current = false;
      activeRef.current = false;
      realtimeRef.current?.close();
      realtimeRef.current = null;
      engineRef.current = null;
      coordinator.release();
      setIsConnected(false);
      setIsConnecting(false);
      setIsVoicePaused(false);
      setPhase("resting");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Some embedded browsers keep document.visibilityState at "visible" for
    // background webviews. Window focus still changes when their tab changes.
    window.addEventListener("blur", pauseActiveVoice);
    window.addEventListener("focus", handleForeground);
    window.addEventListener("pagehide", handlePageHide);
    const focusGuard = window.setInterval(() => {
      if (
        activeRef.current
        && !document.hidden
        && typeof document.hasFocus === "function"
        && !document.hasFocus()
      ) {
        pauseActiveVoice();
      }
    }, 1_000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", pauseActiveVoice);
      window.removeEventListener("focus", handleForeground);
      window.removeEventListener("pagehide", handlePageHide);
      window.clearInterval(focusGuard);
      coordinator.destroy();
      if (voiceTabCoordinatorRef.current === coordinator) {
        voiceTabCoordinatorRef.current = null;
      }
    };
  }, []);

  /**
   * Gia's OpenAI Realtime WebRTC loop. Free launch visitors consent each visit;
   * an existing paid account may retain its account-scoped preference. The
   * unfinished private/local path is not a runtime fallback.
   */
  const startRealtimeVoice = useCallback(async (connectionAttempt: number, signal: AbortSignal) => {
    const session = await connectRealtimeVoice({
      lang: lang === "ru" ? "ru" : "en",
      mode: "gia",
      signal,
      openAIAudioConsent: true,
      events: {
        onListening: () => {
          if (!activeRef.current || engineRef.current !== "realtime") return;
          setLiveText("");
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
          setAnswerAnnouncement(assistant);
          if (isGuest) {
            const token = guestVoiceHandoffTokenRef.current ?? createGiaGuestVoiceHandoffToken();
            guestVoiceHandoffTokenRef.current = token;
            appendGiaGuestVoiceTurn(window.sessionStorage, token, { user, assistant });
          }
          // Voice Gia and text Gia share one memory: persist the spoken turn.
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
          voiceTabCoordinatorRef.current?.release();
          setIsConnected(false);
          setIsVoicePaused(false);
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
    setIsVoicePaused(false);
    setOtherVoiceTabActive(false);
    setVoiceError("");
    setPhase("listening");
  }, [isGuest, lang]);

  const beginLiveConnection = useCallback(async () => {
    if (isConnecting || connectingRef.current) return;

    // Run inside the initiating tap—either the consent button or a later avatar
    // tap—so Android can unlock audio before the network request begins.
    primeMicrophoneAudioContext();

    if (isConnected && engineRef.current === "realtime") {
      if (phase === "manifesting" || phase === "thinking") {
        realtimeRef.current?.interrupt();
        setAnswer("");
        setLiveText("");
        setPhase("listening");
      }
      return;
    }

    if (isConnected) return;

    connectingRef.current = true;
    setIsConnecting(true);
    setVoiceError("");

    const coordinator = voiceTabCoordinatorRef.current;
    if (coordinator && !await coordinator.claim()) {
      connectingRef.current = false;
      setIsConnecting(false);
      setOtherVoiceTabActive(true);
      return;
    }

    const connectionAttempt = connectionAttemptRef.current + 1;
    connectionAttemptRef.current = connectionAttempt;
    const connectAbort = new AbortController();
    voiceConnectAbortRef.current?.abort();
    voiceConnectAbortRef.current = connectAbort;
    setLiveText("");
    setAnswer("");
    setAnswerAnnouncement("");
    try {
      try {
        await startRealtimeVoice(connectionAttempt, connectAbort.signal);
      } catch (error) {
        console.info("Realtime voice unavailable", error);
        if (!mountedRef.current || connectionAttemptRef.current !== connectionAttempt) return;
        activeRef.current = false;
        engineRef.current = null;
        voiceTabCoordinatorRef.current?.release();
        setIsConnected(false);
        setIsVoicePaused(false);
        setPhase("resting");
        setVoiceError(voiceConnectionErrorMessage(error, lang));
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
    window.requestAnimationFrame(() => voiceOrbRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!showRealtimeConsent) return;
    consentCancelRef.current?.focus();
    const containConsentFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRealtimeConsent();
        return;
      }
      if (event.key !== "Tab") return;
      const first = consentCancelRef.current;
      const last = consentConfirmRef.current;
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", containConsentFocus);
    return () => document.removeEventListener("keydown", containConsentFocus);
  }, [cancelRealtimeConsent, showRealtimeConsent]);

  const confirmRealtimeVoice = useCallback(() => {
    const isFreeLive = GIA_LIVE_FREE_LAUNCH && !isPro;
    if (!preferenceLoaded || !hasIdentity) return;
    if (!isFreeLive && preferenceUserId) {
      window.localStorage.setItem(voicePreferenceKey(preferenceUserId), REALTIME_CONSENT_VALUE);
    }
    setVoicePreference("realtime");
    setShowRealtimeConsent(false);
    void beginLiveConnection();
  }, [beginLiveConnection, hasIdentity, isPro, preferenceLoaded, preferenceUserId]);

  const isFreeLive = GIA_LIVE_FREE_LAUNCH && !isPro;
  const canUseLiveVoice = hasLiveVoiceAccess({
    hasIdentity,
    isPro,
    freeLaunch: GIA_LIVE_FREE_LAUNCH,
  });

  const connectToVoice = async () => {
    if (isVoicePaused && isConnected) {
      primeMicrophoneAudioContext();
      const coordinator = voiceTabCoordinatorRef.current;
      coordinator?.refresh();
      if (coordinator && (!coordinator.isOwner() || coordinator.hasOtherOwner())) {
        setOtherVoiceTabActive(true);
        return;
      }

      const resumed = await realtimeRef.current?.resume();
      if (resumed) {
        setIsVoicePaused(false);
        setVoiceError("");
        setLiveText("");
        setAnswer("");
        setPhase("listening");
      } else {
        activeRef.current = false;
        realtimeRef.current?.close();
        realtimeRef.current = null;
        engineRef.current = null;
        coordinator?.release();
        setIsConnected(false);
        setIsVoicePaused(false);
        setPhase("resting");
        setVoiceError(lang === "ru"
          ? "Браузер не смог возобновить звук. Нажми «Попробовать снова»."
          : "Your browser could not resume audio. Choose “Try again”.");
      }
      return;
    }

    if (otherVoiceTabActive && !voiceTabCoordinatorRef.current?.isOwner()) return;

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
    voiceTabCoordinatorRef.current?.release();
    setIsConnected(false);
    setIsConnecting(false);
    setIsVoicePaused(false);
    setOtherVoiceTabActive(false);
    const handoff = guestVoiceHandoffTokenRef.current;
    router.push(handoff ? `/chat?handoff=${encodeURIComponent(handoff)}` : '/chat');
  }, [router]);

  const choosePresence = useCallback((next: PresenceId) => {
    setPresenceId(next);
    window.localStorage.setItem(PRESENCE_STORAGE_KEY, next);
  }, []);

  const closePortrait = useCallback(() => {
    setShowPortrait(false);
    window.requestAnimationFrame(() => voiceOrbRef.current?.focus());
  }, []);

  const showInvocation = phase === "resting";
  const showQuestion = (phase === "listening" || phase === "thinking") && !!liveText;
  const voiceAccessReady = routeModeReady && preferenceLoaded;
  const canOperateVoice = isConnected || canUseLiveVoice;
  const portraitControlsVoice = isConnected || isConnecting || isVoicePaused;
  const invitePool = INVITES[lang];
  const systemState = isConnecting
    ? "CONNECTING"
    : isVoicePaused
      ? "PAUSED"
      : otherVoiceTabActive
        ? "OTHER TAB"
    : phase === "resting"
    ? "STANDBY"
    : phase === "listening"
      ? "LISTENING"
      : phase === "thinking"
        ? "PROCESSING"
        : "TRANSMITTING";

  return (
    <div
      className="voice-stage fixed inset-0 overflow-hidden"
      data-phase={phase}
      data-presence={presenceId}
      data-access={voiceAccessReady ? (isConnected ? "active" : canUseLiveVoice ? "available" : "unavailable") : "checking"}
      data-error={voiceError ? "true" : "false"}
      data-voice-paused={isVoicePaused ? "true" : "false"}
      data-other-voice-tab={otherVoiceTabActive ? "true" : "false"}
      aria-busy={!voiceAccessReady || isConnecting}
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        event.currentTarget.style.setProperty("--gaze-x", `${(x * 18).toFixed(1)}px`);
        event.currentTarget.style.setProperty("--gaze-y", `${(y * 12).toFixed(1)}px`);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--gaze-x", "0px");
        event.currentTarget.style.setProperty("--gaze-y", "0px");
      }}
    >
      <h1 className="sr-only">
        {lang === "ru" ? "Живой голосовой разговор с Джиа" : "Live voice with Gia"}
      </h1>
      <MilaAurora phase={phase} variant="synthetic" />

      <div className="voice-chamber-ui" aria-hidden="true">
        <div className="voice-chamber-ui__brand">
          <span>GIA // COMPANION NODE</span>
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
        type="button"
        onClick={exit}
        aria-label={lang === "ru" ? "Открыть текстовый чат с Джиа" : "Open Gia text chat"}
        title={lang === "ru" ? "Текстовый чат" : "Text chat"}
        className="voice-exit absolute z-30 p-2.5 transition-colors"
        style={{
          top: "max(1.1rem, env(safe-area-inset-top, 0px))",
          right: "max(1.1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <MilaIcon name="conversation" size={18} />
        <span className="voice-exit__label">{lang === "ru" ? "Чат" : "Text chat"}</span>
      </button>

      {!isConnected && !isConnecting ? (
        <PresencePicker value={presenceId} lang={lang} onChange={choosePresence} />
      ) : null}

      <p className="presence-ai-disclosure">
        {lang === "ru" ? "ИИ-персонаж · синтетический образ и голос" : "AI character · synthetic image and voice"}
      </p>

      <PresencePortraitDialog
        open={showPortrait}
        presenceId={presenceId}
        lang={lang}
        canStartLive={voiceAccessReady && canUseLiveVoice && !otherVoiceTabActive}
        isFreeLive={isFreeLive}
        onClose={closePortrait}
        onStartLive={() => {
          setShowPortrait(false);
          void connectToVoice();
        }}
      />

      {showRealtimeConsent && (
        <div className="voice-consent" role="presentation">
          <button
            type="button"
            className="voice-consent__backdrop"
            tabIndex={-1}
            onClick={cancelRealtimeConsent}
            aria-label={lang === "ru" ? "Закрыть окно согласия" : "Close voice consent"}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="realtime-consent-title"
            aria-describedby="realtime-consent-description"
            className="voice-consent__card"
          >
            <p className="voice-consent__eyebrow">
              {isFreeLive
                ? (lang === "ru" ? "Gia Live · бесплатный ранний доступ" : "Gia Live · free early access")
                : (lang === "ru" ? "Gia · живой голос" : "Gia · live voice")}
            </p>
            <h2 id="realtime-consent-title">
              {lang === "ru" ? "Начать живой разговор?" : "Start live voice?"}
            </h2>
            <p id="realtime-consent-description" className="voice-consent__description">
              {isFreeLive
                ? (lang === "ru"
                    ? "Во время бесплатного раннего доступа звук с микрофона и расшифровка отправляются в OpenAI для разговора в реальном времени. Согласие действует только для текущего посещения; можно отменить и продолжить в текстовом чате. Оплата не требуется."
                    : "During free early access, your microphone audio and transcript are sent to OpenAI to run the real-time conversation. Your consent applies only to this visit; you can cancel and continue in text chat. No payment is required.")
                : (lang === "ru"
                    ? "В Live-режиме звук с микрофона и расшифровка отправляются в OpenAI для разговора в реальном времени. Выбирай его, только если согласен. Настройка сохранится на этом устройстве для твоего Pro-аккаунта; вместо этого можно продолжить в текстовом чате."
                    : "Live mode sends your microphone audio and transcript to OpenAI for real-time conversation. Choose it only if you consent. This preference is saved on this device for your Pro account; you can continue in text chat instead.")}
            </p>
            <div className="voice-consent__actions">
              <button
                ref={consentCancelRef}
                type="button"
                className="voice-consent__secondary"
                onClick={exit}
              >
                {lang === "ru" ? "Перейти в текстовый чат" : "Continue in text chat"}
              </button>
              <button
                ref={consentConfirmRef}
                type="button"
                className="voice-consent__primary"
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
        ref={voiceOrbRef}
        type="button"
        onClick={portraitControlsVoice ? connectToVoice : () => setShowPortrait(true)}
        disabled={portraitControlsVoice && (!preferenceLoaded || !canOperateVoice)}
        aria-haspopup={portraitControlsVoice ? undefined : "dialog"}
        aria-label={portraitControlsVoice
          ? !voiceAccessReady
            ? (lang === "ru" ? "Проверяем доступ к Live-голосу" : "Checking live voice access")
            : isConnected
            ? isVoicePaused
              ? (lang === "ru" ? "Возобновить разговор с Джиа" : "Resume Gia")
              : phase === "manifesting"
              ? (lang === "ru" ? "Прервать ответ Джиа" : "Interrupt Gia")
              : (lang === "ru" ? "Говорить с Джиа" : "Speak with Gia")
            : !canUseLiveVoice
              ? (lang === "ru" ? "Live-голос недоступен" : "Live voice unavailable")
              : (lang === "ru" ? "Начать голосовой разговор" : "Start live voice")
          : (lang === "ru" ? "Открыть расширенный портрет Джиа" : "View Gia’s expanded portrait")}
        className="voice-orb absolute left-1/2 z-10 outline-none"
        style={{
          top: "42%",
          transform: "translate(-50%, -50%)",
          background: "transparent",
          border: "none",
          cursor: portraitControlsVoice && (!voiceAccessReady || !canOperateVoice) ? "default" : "pointer",
        }}
      >
        {/* Wordless invitation — a ripple of light that says: touch me */}
        {showInvocation && voiceAccessReady && canUseLiveVoice && !isConnected && !isConnecting && (
          <span className="voice-ripplewrap" aria-hidden="true">
            <span className="voice-ripple" />
            <span className="voice-ripple voice-ripple--delay" />
          </span>
        )}

        {isConnecting && (
           <div className="voice-connecting absolute inset-0 rounded-full border-2 border-t-transparent animate-spin z-20 pointer-events-none" style={{ width: orbSize, height: orbSize, left: '50%', top: '50%', marginLeft: -orbSize/2, marginTop: -orbSize/2 }}></div>
        )}

        <MilaPresence presenceId={presenceId} state={phase} size={orbSize} lang={lang} />
        {!portraitControlsVoice ? (
          <span className="voice-portrait-cue" aria-hidden="true">
            {lang === "ru" ? "Портрет" : "View portrait"}
          </span>
        ) : null}
      </button>

      {/* The invitation the orb breathes at rest */}
      {isVoicePaused && !voiceError && (
        <div className="voice-invoke" data-show="1" aria-live="polite">
          <strong>{lang === "ru" ? "Live-голос на паузе" : "Live voice paused"}</strong>
          <span className="voice-invoke-line">
            {lang === "ru"
              ? "Нажми на Джиа, чтобы снова включить микрофон и звук"
              : "Tap Gia to resume your microphone and audio"}
          </span>
        </div>
      )}

      {(!isConnected && !isConnecting && !voiceError) && (
        <div className="voice-invoke" data-show={showInvocation ? "1" : "0"}>
          {otherVoiceTabActive ? (
            <>
              <strong>{lang === "ru" ? "Джиа уже говорит в другой вкладке" : "Gia is live in another tab"}</strong>
              <span className="voice-invoke-line">
                {lang === "ru"
                  ? "Вернись в ту вкладку, чтобы продолжить — эта останется без звука"
                  : "Return to that tab to resume — this one will stay silent"}
              </span>
            </>
          ) : !voiceAccessReady ? (
            <>
              <strong>{lang === "ru" ? "Готовим Джиа…" : "Preparing Gia…"}</strong>
              <span className="voice-invoke-line">
                {lang === "ru" ? "Проверяем доступ к Live-голосу" : "Checking live voice access"}
              </span>
            </>
          ) : canUseLiveVoice ? (
            <button
              type="button"
              className="voice-start-cta"
              onClick={connectToVoice}
              aria-label={isFreeLive
                ? (lang === "ru" ? "Начать Gia Live бесплатно" : "Start Gia Live free")
                : (lang === "ru" ? "Начать Gia Live" : "Start Gia Live")}
            >
              <strong>
                {isFreeLive
                  ? (lang === "ru" ? "Начать Gia Live бесплатно" : "Start Gia Live free")
                  : (lang === "ru" ? "Нажми, чтобы начать Live с Джиа" : "Tap to start Live with Gia")}
              </strong>
              <span key={invI} className="voice-invoke-line">
                {invitePool[invI % invitePool.length]}
              </span>
            </button>
          ) : (
            <>
              <strong>
                {accessCheckFailed
                  ? (lang === "ru" ? "Не удалось проверить доступ к Live" : "Live access could not be checked")
                  : (lang === "ru" ? "Войди, чтобы начать Gia Live бесплатно" : "Sign in to start Gia Live free")}
              </strong>
              <span className="voice-invoke-line">
                {lang === "ru"
                  ? "Текстовый чат остаётся доступным — оплата не требуется"
                  : "Text chat stays available—no payment required"}
              </span>
              <div className="voice-unavailable-actions">
                <button type="button" className="voice-text-handoff" onClick={exit}>
                  <MilaIcon name="conversation" size={16} />
                  <span>{lang === "ru" ? "Продолжить в чате" : "Continue in text chat"}</span>
                  <MilaIcon name="arrow" size={15} />
                </button>
                <a
                  className="voice-access-link"
                  href="/pricing"
                  aria-label={lang === "ru"
                    ? "Как работает бесплатный доступ к Gia Live"
                    : "How free Gia Live access works"}
                >
                  <span>{lang === "ru" ? "О бесплатном доступе" : "About free access"}</span>
                  <MilaIcon name="arrow" size={14} />
                </a>
              </div>
            </>
          )}
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
          <div className="voice-a">
            {answer.split(" ").map((w, i) => (
              <span key={i} className={`voice-aword${i === 0 ? " is-init" : ""}`}>
                {w}{" "}
              </span>
            ))}
          </div>
        </>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {answerAnnouncement}
      </p>

      {/* Status */}
      {isConnected && (
        <div
          className="absolute bottom-[8%] left-1/2 z-20 w-[90%] max-w-md -translate-x-1/2"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          aria-live="polite"
        >
          <p className="text-center text-[11px] tracking-[0.1em] uppercase mb-2 transition-colors duration-300">
            {isVoicePaused ? (
              <span className="voice-status voice-status--paused">
                {lang === "ru" ? "На паузе — нажми на Джиа" : "Paused — tap Gia to resume"}
              </span>
            ) : phase === "listening" ? (
              <span className="voice-status voice-status--listening">
                {lang === "ru" ? "● Слушаю тебя" : "● Hearing you"}
              </span>
            ) : phase === "thinking" ? (
              <span className="voice-status voice-status--thinking">
                {lang === "ru" ? "Обдумываю…" : "Reflecting…"}
              </span>
            ) : phase === "manifesting" ? (
              <span className="voice-status voice-status--speaking">
                {lang === "ru" ? "Говорю — нажми, чтобы прервать" : "Speaking — tap to interrupt"}
              </span>
            ) : (
              <span className="voice-status voice-status--resting">
                {lang === "ru" ? "Скажи что-нибудь" : "Speak to start"}
              </span>
            )}
          </p>
        </div>
      )}

      {voiceError && (
        <div className="voice-error absolute bottom-[3%] left-1/2 z-20 w-[90%] max-w-md -translate-x-1/2 text-center text-xs">
          <p role="alert">{voiceError}</p>
          <div className="voice-error__actions">
            {canUseLiveVoice ? (
              <button type="button" onClick={connectToVoice}>
                {lang === "ru" ? "Попробовать снова" : "Try again"}
              </button>
            ) : null}
            <button type="button" onClick={exit}>
              {lang === "ru" ? "Текстовый чат" : "Text chat"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
