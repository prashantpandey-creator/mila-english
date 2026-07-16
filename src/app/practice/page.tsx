"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MilaVoid } from "@/components/darshan/MilaVoid";
import { MilaBindu, type BinduState } from "@/components/darshan/MilaBindu";
import { useI18n } from "@/lib/i18n-provider";
import { startLocalTranscription, type TranscriptionSession } from "@/lib/localTranscription";
import { createStreamingTtsSession, spokenLocaleForText, ttsSpeakBrowser } from "@/lib/tts";
import { toSpokenText } from "@/lib/spokenText";
import { announceCompanionHistoryUpdated } from "@/lib/use-companion-history";
import { streamVoiceReply } from "@/lib/voiceChatStream";
import { endpointSilenceMs, pickBackchannel } from "@/lib/voiceTurn";
import { parseVoiceCommand } from "@/lib/voiceCommands";
import { getBuiltinLesson } from "@/lib/builtinLessons";

// The focused speaking room. Unlike the retired Darshan room this one has a
// job: it drills the CURRENT LESSON by voice — one small task per turn, fed
// by the lesson content the chat route injects for /lessons/{id} paths.
// It deliberately speaks in the TEACHER register (natural pitch, calm rate),
// not the mascot's raised MASCOT_PITCH — same capability, different being.
const TEACHER_PITCH = 1;
const TEACHER_RATE = 0.92;

function PracticeRoom() {
  const router = useRouter();
  const search = useSearchParams();
  const { lang } = useI18n();

  const lessonId = search.get("lesson") || "1";
  const lessonPath = `/lessons/${lessonId}`;
  const lesson = getBuiltinLesson(lessonId) || getBuiltinLesson("1");

  const [phase, setPhase] = useState<BinduState>("resting");
  const [running, setRunning] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [heardText, setHeardText] = useState("");
  const [error, setError] = useState("");

  const activeRef = useRef(false);
  const turnRef = useRef(0);
  const micRef = useRef<TranscriptionSession | null>(null);
  const partialRef = useRef<string | null>(null);
  const backchannelIdxRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const requestLang = lang === "ru" ? "ru" : "en";
  const uiLocale = lang === "ru" ? "ru-RU" : "en-US";

  const stopEverything = useCallback(() => {
    activeRef.current = false;
    turnRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    micRef.current?.cancel();
    micRef.current = null;
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => stopEverything, [stopEverything]);

  const speakTurn = useCallback(async (userText: string, turnId: number): Promise<string> => {
    const locale = spokenLocaleForText(userText, uiLocale);
    const tts = await createStreamingTtsSession(locale, TEACHER_RATE, () => {
      if (activeRef.current && turnRef.current === turnId) setPhase("manifesting");
    }, false, TEACHER_PITCH);
    try {
      const { reply } = await streamVoiceReply({
        text: userText,
        lang: requestLang,
        pathname: lessonPath,
        surface: "practice",
        onDelta: (full) => {
          if (turnRef.current !== turnId) return;
          const spoken = toSpokenText(full);
          if (spoken) {
            setTaskText(spoken);
            tts.push(spoken);
          }
        },
      });
      const spoken = toSpokenText(reply);
      if (!spoken) {
        tts.cancel();
        return "";
      }
      announceCompanionHistoryUpdated();
      setTaskText(spoken);
      await tts.finish(spoken, true);
      return spoken;
    } catch (problem) {
      tts.cancel();
      throw problem;
    }
  }, [lessonPath, requestLang, uiLocale]);

  const listenLoop = useCallback(async () => {
    if (!activeRef.current) return;
    const turnId = turnRef.current;
    partialRef.current = null;
    setHeardText("");
    setPhase("listening");
    try {
      const mic = await startLocalTranscription({
        language: "auto",
        partialAfterMs: 450,
        getSilenceMs: () => endpointSilenceMs(partialRef.current),
        onPartial: (partial) => {
          if (turnRef.current !== turnId) return;
          partialRef.current = partial.text;
          setHeardText(partial.text);
        },
        onScoring: () => {
          if (!activeRef.current || turnRef.current !== turnId) return;
          setPhase("thinking");
          const fillerLocale = spokenLocaleForText(partialRef.current || "", uiLocale);
          const pick = pickBackchannel(fillerLocale === "ru-RU" ? "ru" : "en", turnId, backchannelIdxRef.current);
          backchannelIdxRef.current = pick.index;
          void ttsSpeakBrowser(pick.text, fillerLocale, 1, TEACHER_PITCH);
        },
        onAutoStop: (transcript) => {
          void (async () => {
            const text = transcript.text.trim();
            micRef.current = null;
            if (!activeRef.current || turnRef.current !== turnId || !text) return scheduleListen(600);
            setHeardText(text);
            const command = parseVoiceCommand(text);
            if (command) {
              window.speechSynthesis?.cancel();
              if (command.kind === "back") router.back();
              else router.push(command.route);
              return;
            }
            try {
              await speakTurn(text, turnId);
            } catch {
              if (activeRef.current && turnRef.current === turnId) {
                setError(lang === "ru" ? "Мила не смогла ответить. Коснись сферы." : "Mila could not answer. Touch the orb.");
                setPhase("resting");
                setRunning(false);
                return;
              }
            }
            if (activeRef.current && turnRef.current === turnId) scheduleListen(350);
          })();
        },
        onError: (problem) => {
          micRef.current = null;
          if (!activeRef.current || problem.message === "cancelled") return;
          if (problem.message === "no-speech" || problem.message === "transcribe-empty") return scheduleListen(600);
          setError(problem.message === "auth-required"
            ? (lang === "ru" ? "Войди в аккаунт, чтобы практиковаться голосом." : "Log in to practise by voice.")
            : (lang === "ru" ? "Не удалось распознать речь. Проверь микрофон." : "I could not transcribe that. Check the microphone."));
          setPhase("resting");
          setRunning(false);
        },
      });
      if (!activeRef.current || turnRef.current !== turnId) return mic.cancel();
      micRef.current = mic;
    } catch {
      activeRef.current = false;
      setRunning(false);
      setError(lang === "ru" ? "Нет доступа к микрофону." : "Microphone access is unavailable.");
      setPhase("resting");
    }
    function scheduleListen(delay: number) {
      if (!activeRef.current || turnRef.current !== turnId) return;
      timerRef.current = window.setTimeout(() => void listenLoop(), delay);
    }
  }, [lang, router, speakTurn, uiLocale]);

  const begin = useCallback(async () => {
    if (running) {
      // A tap while she speaks interrupts and returns to listening.
      if (phase === "manifesting" || phase === "thinking") {
        turnRef.current += 1;
        window.speechSynthesis?.cancel();
        timerRef.current = window.setTimeout(() => void listenLoop(), 250);
      }
      return;
    }
    setError("");
    setRunning(true);
    activeRef.current = true;
    turnRef.current += 1;
    const turnId = turnRef.current;
    setPhase("thinking");
    try {
      await speakTurn(lang === "ru" ? "Начнём практику." : "Let's start the practice.", turnId);
      if (activeRef.current && turnRef.current === turnId) void listenLoop();
    } catch {
      setRunning(false);
      activeRef.current = false;
      setPhase("resting");
      setError(lang === "ru" ? "Мила не смогла начать. Попробуй ещё раз." : "Mila could not start. Try again.");
    }
  }, [lang, listenLoop, phase, running, speakTurn]);

  const exit = useCallback(() => {
    stopEverything();
    router.push(lessonPath);
  }, [lessonPath, router, stopEverything]);

  const lessonTitle = lesson ? (lang === "ru" ? lesson.titleRu : lesson.titleEn) : "";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <MilaVoid phase={phase} />

      <button
        onClick={exit}
        aria-label={lang === "ru" ? "Выйти из практики" : "Leave practice"}
        className="absolute z-30 rounded-full p-2.5 text-[#fbcfe8] hover:text-white transition-colors"
        style={{ top: "max(1.1rem, env(safe-area-inset-top, 0px))", right: "max(1.1rem, env(safe-area-inset-right, 0px))" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>

      <div className="absolute top-0 left-0 right-0 z-20 pt-5 text-center" style={{ paddingTop: "max(1.2rem, env(safe-area-inset-top, 0px))" }}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-pink-200/60 m-0">
          {lang === "ru" ? "Разговорная практика" : "Speaking practice"}
        </p>
        {lessonTitle && <p className="text-sm text-pink-100/80 mt-1 m-0">{lessonTitle}</p>}
      </div>

      <button
        type="button"
        onClick={begin}
        aria-label={running ? (lang === "ru" ? "Прервать" : "Interrupt") : (lang === "ru" ? "Начать практику" : "Begin practice")}
        className="absolute left-1/2 z-10 outline-none"
        style={{ top: "44%", transform: "translate(-50%, -50%)", background: "transparent", border: "none", cursor: "pointer" }}
      >
        <MilaBindu state={phase} size={300} />
      </button>

      <div className="absolute left-1/2 z-20 w-[88%] max-w-md -translate-x-1/2 text-center" style={{ top: "68%" }} aria-live="polite">
        {taskText && phase !== "listening" && (
          <p className="text-pink-50 text-base leading-relaxed m-0">{taskText}</p>
        )}
        {heardText && phase === "listening" && (
          <p className="text-pink-200/85 text-sm leading-relaxed m-0">{heardText}</p>
        )}
      </div>

      <div className="absolute bottom-[7%] left-1/2 z-20 w-[90%] max-w-md -translate-x-1/2 text-center" aria-live="polite">
        <p className="text-[11px] tracking-[0.1em] uppercase m-0">
          {!running ? (
            <span className="text-pink-200/60">{lang === "ru" ? "Коснись сферы, чтобы начать" : "Touch the orb to begin"}</span>
          ) : phase === "listening" ? (
            <span className="text-pink-400">● {lang === "ru" ? "Говори" : "Your turn"}</span>
          ) : phase === "thinking" ? (
            <span className="text-purple-400">{lang === "ru" ? "Мила думает…" : "Mila is thinking…"}</span>
          ) : (
            <span className="text-pink-300">{lang === "ru" ? "Слушай задание" : "Listen to the task"}</span>
          )}
        </p>
        {error && <p className="text-xs text-rose-200 mt-2" role="alert">{error}</p>}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <PracticeRoom />
    </Suspense>
  );
}
