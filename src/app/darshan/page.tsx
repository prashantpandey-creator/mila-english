"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MilaVoid } from "@/components/darshan/MilaVoid";
import { MilaBindu, type BinduState } from "@/components/darshan/MilaBindu";
import { useI18n } from "@/lib/i18n-provider";
import { startLocalTranscription, type LocalTranscript, type TranscriptionSession } from "@/lib/localTranscription";
import { createStreamingTtsSession, spokenLocaleForText, ttsSpeakBrowser, type StreamingTtsSession } from "@/lib/tts";
import { toSpokenText } from "@/lib/spokenText";
import { announceCompanionHistoryUpdated } from "@/lib/use-companion-history";
import { streamVoiceReply } from "@/lib/voiceChatStream";
import { draftMatches, endpointSilenceMs, pickBackchannel } from "@/lib/voiceTurn";

const INVITES = [
  "What do you wish to know?",
  "Bring your question.",
  "Ask, and the AI will answer.",
  "Even silence is heard.",
  "What do you seek?",
];

// While the learner speaks, each mid-speech pause fires a speculative reply
// draft against the partial transcript. A draft is committed only when the
// final transcript matches it; otherwise it is aborted and a normal request
// runs. Flip to false to fall back to strictly sequential turns.
const SPECULATIVE_DRAFTS = true;

type Draft = {
  transcript: string;
  text: string;
  done: boolean;
  failed: boolean;
  controller: AbortController;
  promise: Promise<string>;
  onUpdate: ((full: string) => void) | null;
};

export default function DarshanPage() {
  const router = useRouter();
  const { lang } = useI18n();

  const [phase, setPhase] = useState<BinduState>("resting");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const [liveText, setLiveText] = useState("");
  const [answer, setAnswer] = useState("");
  const [invI, setInvI] = useState(0);
  const [orbSize, setOrbSize] = useState(320);

  const transcriptionRef = useRef<TranscriptionSession | null>(null);
  const speechSessionRef = useRef<Promise<StreamingTtsSession> | null>(null);
  const listeningStartRef = useRef(false);
  const loadingRef = useRef(false);
  const turnRef = useRef(0);
  const restartTimerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});
  const latestPartialRef = useRef<string | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const backchannelIndexRef = useRef<number | null>(null);
  const fillerPlayedRef = useRef(false);

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

  const abortDraft = useCallback(() => {
    const draft = draftRef.current;
    draftRef.current = null;
    draft?.controller.abort();
  }, []);

  const fireDraft = useCallback((partialText: string) => {
    if (!SPECULATIVE_DRAFTS || !activeRef.current || loadingRef.current) return;
    const transcript = partialText.trim();
    if (!transcript) return;
    const current = draftRef.current;
    if (current && current.transcript === transcript) return;
    current?.controller.abort();
    const controller = new AbortController();
    const draft: Draft = {
      transcript,
      text: "",
      done: false,
      failed: false,
      controller,
      promise: Promise.resolve(""),
      onUpdate: null,
    };
    draft.promise = streamVoiceReply({
      text: transcript,
      lang: lang === "ru" ? "ru" : "en",
      speculative: true,
      signal: controller.signal,
      onDelta: (full) => {
        draft.text = full;
        draft.onUpdate?.(full);
      },
    }).then((response) => {
      draft.text = response.reply;
      draft.done = true;
      draft.onUpdate?.(response.reply);
      return response.reply;
    }).catch(() => {
      draft.failed = true;
      draft.done = true;
      return "";
    });
    draftRef.current = draft;
  }, [lang]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      turnRef.current += 1;
      clearRestartTimer();
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      const draft = draftRef.current;
      draftRef.current = null;
      draft?.controller.abort();
      transcriptionRef.current?.cancel();
      transcriptionRef.current = null;
      cancelSpeechSession();
    };
  }, [cancelSpeechSession, clearRestartTimer]);

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

  const submitTranscript = useCallback(async (transcript: LocalTranscript) => {
    const text = transcript.text.trim();
    transcriptionRef.current = null;
    latestPartialRef.current = null;
    if (!text || !activeRef.current) return;
    setLiveText(text);
    setAnswer("");
    setVoiceError("");
    setPhase("thinking");
    clearRestartTimer();
    // When the endpoint filler is speaking, the cleanup already ran in
    // onScoring — a second cancel here would silence the filler itself.
    if (!fillerPlayedRef.current) cancelSpeechSession();
    const turnId = turnRef.current + 1;
    turnRef.current = turnId;
    loadingRef.current = true;
    setIsBusy(true);

    const draft = draftRef.current;
    draftRef.current = null;
    const draftHit = !!draft && !draft.failed && draftMatches(draft.transcript, text);
    if (draft && !draftHit) draft.controller.abort();

    const requestLang = lang === "ru" ? "ru" : "en";
    const spokenLocale = spokenLocaleForText(text, lang === "ru" ? "ru-RU" : "en-US");
    // Never cancel on create while the filler hums — chunks queue behind it.
    const sessionPromise = createStreamingTtsSession(spokenLocale, 0.9, () => {
      if (!activeRef.current || turnRef.current !== turnId) return;
      setPhase("manifesting");
    }, !fillerPlayedRef.current);
    speechSessionRef.current = sessionPromise;

    const endTurn = (restAndListen: boolean) => {
      if (turnRef.current !== turnId) return;
      if (speechSessionRef.current === sessionPromise) speechSessionRef.current = null;
      requestControllerRef.current = null;
      fillerPlayedRef.current = false;
      loadingRef.current = false;
      setIsBusy(false);
      if (!activeRef.current || !restAndListen) return;
      setPhase("resting");
      scheduleListening(turnId);
    };

    try {
      const sessionBox = { current: await sessionPromise, pushedAny: false };
      if (turnRef.current !== turnId || !activeRef.current) return;

      const handleDelta = (full: string) => {
        if (turnRef.current !== turnId || !activeRef.current) return;
        const spoken = toSpokenText(full);
        if (!spoken) return;
        sessionBox.pushedAny = true;
        setAnswer(spoken);
        sessionBox.current.push(spoken);
      };

      const runRealRequest = async (): Promise<string> => {
        // A partially spoken failed draft cannot be extended by a fresh reply
        // (the TTS session is append-only) — restart the session first.
        if (sessionBox.pushedAny) {
          sessionBox.current.cancel();
          const fresh = createStreamingTtsSession(spokenLocale, 0.9, () => {
            if (!activeRef.current || turnRef.current !== turnId) return;
            setPhase("manifesting");
          });
          speechSessionRef.current = fresh;
          sessionBox.current = await fresh;
          sessionBox.pushedAny = false;
        }
        const controller = new AbortController();
        requestControllerRef.current = controller;
        const response = await streamVoiceReply({
          text,
          lang: requestLang,
          signal: controller.signal,
          onDelta: handleDelta,
        });
        return response.reply;
      };

      let reply = "";
      if (draftHit) {
        requestControllerRef.current = draft!.controller;
        draft!.onUpdate = handleDelta;
        if (draft!.text) handleDelta(draft!.text);
        reply = await draft!.promise;
        if (turnRef.current !== turnId) return;
        if (draft!.failed || !toSpokenText(reply)) {
          reply = await runRealRequest();
        } else {
          void fetch("/api/chat/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: text, assistant: reply, lang: requestLang }),
          }).catch((error) => console.error("Could not persist a committed Darshan draft", error));
        }
      } else {
        reply = await runRealRequest();
      }
      if (turnRef.current !== turnId) return;

      const spokenReply = toSpokenText(reply);
      if (!spokenReply) {
        cancelSpeechSession();
        endTurn(true);
        return;
      }
      announceCompanionHistoryUpdated();
      setAnswer(spokenReply);
      await sessionBox.current.finish(spokenReply, true);
      endTurn(true);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      if (turnRef.current !== turnId) return;
      console.error("Could not complete a Darshan turn", error);
      cancelSpeechSession();
      endTurn(false);
      if (!activeRef.current) return;
      setVoiceError(lang === "ru"
        ? "Мила не смогла ответить. Коснись сферы, чтобы попробовать снова."
        : "Mila could not answer. Touch the orb to try again.");
      setPhase("resting");
    }
  }, [cancelSpeechSession, clearRestartTimer, lang, scheduleListening]);

  const startListening = useCallback(async () => {
    if (!activeRef.current || transcriptionRef.current || listeningStartRef.current || loadingRef.current) return;
    listeningStartRef.current = true;
    setVoiceError("");
    setLiveText("");
    setAnswer("");
    setPhase("listening");
    latestPartialRef.current = null;
    fillerPlayedRef.current = false;
    try {
      const session = await startLocalTranscription({
        language: "auto",
        partialAfterMs: 450,
        getSilenceMs: () => endpointSilenceMs(latestPartialRef.current),
        onPartial: (partial) => {
          if (!activeRef.current) return;
          latestPartialRef.current = partial.text;
          setLiveText(partial.text);
          fireDraft(partial.text);
        },
        onVoiceResume: () => {
          latestPartialRef.current = null;
          abortDraft();
        },
        onScoring: () => {
          // End of turn — first sound NOW, before transcription finishes. On a
          // slow ASR box this is the difference between a breath and ten
          // seconds of "is she even hearing me".
          setPhase("thinking");
          if (!activeRef.current || fillerPlayedRef.current) return;
          cancelSpeechSession();
          const fillerLocale = spokenLocaleForText(
            latestPartialRef.current || "",
            lang === "ru" ? "ru-RU" : "en-US",
          );
          const pick = pickBackchannel(
            fillerLocale === "ru-RU" ? "ru" : "en",
            turnRef.current + 1,
            backchannelIndexRef.current,
          );
          backchannelIndexRef.current = pick.index;
          fillerPlayedRef.current = true;
          // Browser engine only: the filler must share speechSynthesis's queue
          // with the answer chunks — a Piper clip would overlap them.
          void ttsSpeakBrowser(pick.text, fillerLocale, 1);
        },
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
            setVoiceError(lang === "ru"
              ? "Войди в аккаунт, чтобы говорить с Милой голосом."
              : "Log in to talk with Mila by voice.");
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
      console.error("Could not start local Darshan transcription", error);
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
  }, [abortDraft, cancelSpeechSession, fireDraft, lang, scheduleListening, submitTranscript]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const connectToDarshan = async () => {
    if (isConnecting) return;
    const canInterruptGeneration = phase === "manifesting" || (phase === "thinking" && isBusy);
    if (isBusy && !canInterruptGeneration) return;

    if (isConnected) {
      if (canInterruptGeneration) {
        const nextTurn = turnRef.current + 1;
        turnRef.current = nextTurn;
        requestControllerRef.current?.abort();
        requestControllerRef.current = null;
        abortDraft();
        loadingRef.current = false;
        setIsBusy(false);
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
    activeRef.current = true;
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
    clearRestartTimer();
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    abortDraft();
    transcriptionRef.current?.cancel();
    transcriptionRef.current = null;
    cancelSpeechSession();
    setIsConnected(false);
    router.push('/chat');
  }, [abortDraft, cancelSpeechSession, clearRestartTimer, router]);

  const showInvocation = phase === "resting";
  const showQuestion = (phase === "listening" || phase === "thinking") && !!liveText;

  return (
    <div className="darshan-stage fixed inset-0 overflow-hidden bg-black">
      <MilaVoid phase={phase} />

      <button
        onClick={exit}
        aria-label="Leave darshan"
        className="absolute z-30 rounded-full p-2.5 text-[#fbcfe8] hover:text-white transition-colors"
        style={{
          top: "max(1.1rem, env(safe-area-inset-top, 0px))",
          right: "max(1.1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>

      {/* The bindu — edgeless, centered, the touch target */}
      <button
        type="button"
        onClick={connectToDarshan}
        aria-label={!isConnected ? "Touch to begin" : phase === "manifesting" ? "Interrupt" : "Speak or stop recording"}
        className="darshan-orb absolute left-1/2 z-10 outline-none"
        style={{ top: "42%", transform: "translate(-50%, -50%)", background: "transparent", border: "none", cursor: "pointer" }}
      >
        {/* Wordless invitation — a ripple of light that says: touch me */}
        {showInvocation && !isConnected && !isConnecting && (
          <span className="darshan-ripplewrap" aria-hidden="true">
            <span className="darshan-ripple" />
            <span className="darshan-ripple darshan-ripple--delay" />
          </span>
        )}

        {isConnecting && (
           <div className="absolute inset-0 rounded-full border-2 border-pink-500/50 border-t-transparent animate-spin z-20 pointer-events-none" style={{ width: orbSize, height: orbSize, left: '50%', top: '50%', marginLeft: -orbSize/2, marginTop: -orbSize/2 }}></div>
        )}

        <MilaBindu state={phase} size={orbSize} />
      </button>

      {/* The invocation the bindu breathes at rest */}
      {(!isConnected && !isConnecting) && (
        <div className="darshan-invoke" data-show={showInvocation ? "1" : "0"} aria-live="polite">
          <span key={invI} className="darshan-invoke-line">{INVITES[invI % INVITES.length]}</span>
        </div>
      )}

      {/* The seeker's question — rises, then collapses into the flame */}
      <div className={`darshan-q ${showQuestion ? "is-on" : ""} ${phase === "thinking" ? "is-suck" : ""}`} aria-live="polite">
        {liveText}
      </div>

      {/* The AI's answer — emerges from the flame in pink/white (and is spoken) */}
      {phase === "manifesting" && answer && (
        <>
          <div className="darshan-ascrim" aria-hidden="true" />
          <div className="darshan-a" aria-live="polite">
            {answer.split(" ").map((w, i) => (
              <span key={i} className={`darshan-aword${i === 0 ? " is-init" : ""}`} style={{ animationDelay: `${Math.min(i * 0.09, 3)}s` }}>
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
