"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MilaVoid } from "@/components/darshan/MilaVoid";
import { MilaBindu, type BinduState } from "@/components/darshan/MilaBindu";
import { useI18n } from "@/lib/i18n-provider";
import { startLocalTranscription, type TranscriptionSession } from "@/lib/localTranscription";
import { createStreamingTtsSession, prefetchFillerClips, spokenLocaleForText, ttsSpeakFiller } from "@/lib/tts";
import { toSpokenText } from "@/lib/spokenText";
import { announceCompanionHistoryUpdated } from "@/lib/use-companion-history";
import { streamVoiceReply } from "@/lib/voiceChatStream";
import { backchannelTexts, endpointSilenceMs, pickBackchannel } from "@/lib/voiceTurn";
import { parseVoiceCommand } from "@/lib/voiceCommands";
import { getBuiltinLesson } from "@/lib/builtinLessons";
import { hasActiveSession } from "@/lib/guestSession";

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
  const guestTriedRef = useRef(false);
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
          void ttsSpeakFiller(pick.text, fillerLocale, 1);
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
          if (problem.message === "auth-required" && !guestTriedRef.current) {
            // Never dead-end on auth: seat a guest and continue the practice.
            guestTriedRef.current = true;
            void hasActiveSession().then((seated) => {
              if (seated && activeRef.current) return scheduleListen(300);
              setError(lang === "ru" ? "Войди в аккаунт, чтобы практиковаться голосом." : "Log in to practise by voice.");
              setPhase("resting");
              setRunning(false);
            });
            return;
          }
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
    void prefetchFillerClips(backchannelTexts("en"));
    activeRef.current = true;
    turnRef.current += 1;
    const turnId = turnRef.current;
    setPhase("thinking");
    const kickoff = lang === "ru" ? "Начнём практику." : "Let's start the practice.";
    let started = false;
    try {
      await speakTurn(kickoff, turnId);
      started = true;
    } catch {
      // Most common cause: no session yet. Seat a guest and retry once.
      if (!guestTriedRef.current) {
        guestTriedRef.current = true;
        if (await hasActiveSession()) {
          try {
            await speakTurn(kickoff, turnId);
            started = true;
          } catch { /* fall through to the error state */ }
        }
      }
    }
    if (started) {
      if (activeRef.current && turnRef.current === turnId) void listenLoop();
      return;
    }
    setRunning(false);
    activeRef.current = false;
    setPhase("resting");
    setError(lang === "ru" ? "Мила не смогла начать. Попробуй ещё раз." : "Mila could not start. Try again.");
  }, [lang, listenLoop, phase, running, speakTurn]);

  const exit = useCallback(() => {
    stopEverything();
    router.push(lessonPath);
  }, [lessonPath, router, stopEverything]);

  const lessonTitle = lesson ? (lang === "ru" ? lesson.titleRu : lesson.titleEn) : "";

  return (
    <main className="practice-room" data-phase={phase}>
      <MilaVoid phase={phase} className="practice-room__void" />
      <div className="practice-room__veil" aria-hidden="true" />

      <header className="practice-header">
        <span className="practice-header__spacer" aria-hidden="true" />
        <div className="practice-header__copy">
          <p className="practice-header__eyebrow">
            {lang === "ru" ? "Разговорная практика" : "Speaking practice"}
          </p>
          {lessonTitle && <p className="practice-header__title">{lessonTitle}</p>}
        </div>
        <button
          type="button"
          onClick={exit}
          aria-label={lang === "ru" ? "Выйти из практики" : "Leave practice"}
          className="practice-header__exit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <section className="practice-orb" aria-label={lang === "ru" ? "Голосовая практика с Милой" : "Voice practice with Mila"}>
        <button
          type="button"
          onClick={begin}
          aria-label={running ? (lang === "ru" ? "Прервать" : "Interrupt") : (lang === "ru" ? "Начать практику" : "Begin practice")}
          className="practice-orb__button"
        >
          <MilaBindu state={phase} size={300} className="practice-orb__visual" />
        </button>
      </section>

      <footer className="practice-live" aria-live="polite">
        {(taskText && phase !== "listening") || (heardText && phase === "listening") ? (
          <p className="practice-live__caption">
            {phase === "listening" ? heardText : taskText}
          </p>
        ) : null}
        <p className="practice-live__status">
          {!running ? (
            <span>{lang === "ru" ? "Коснись сферы, чтобы начать" : "Touch the orb to begin"}</span>
          ) : phase === "listening" ? (
            <span className="practice-live__status--listening"><i aria-hidden />{lang === "ru" ? "Говори" : "Your turn"}</span>
          ) : phase === "thinking" ? (
            <span className="practice-live__status--thinking">{lang === "ru" ? "Мила думает…" : "Mila is thinking…"}</span>
          ) : (
            <span className="practice-live__status--speaking">{lang === "ru" ? "Слушай задание" : "Listen to the task"}</span>
          )}
        </p>
        {error && <p className="practice-live__error" role="alert">{error}</p>}
      </footer>

      <style jsx>{`
        .practice-room {
          position: fixed;
          inset: 0;
          isolation: isolate;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
          gap: clamp(0.5rem, 2dvh, 1.25rem);
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
          box-sizing: border-box;
          overflow-x: hidden;
          overflow-y: auto;
          padding:
            max(0.75rem, env(safe-area-inset-top, 0px))
            max(0.75rem, env(safe-area-inset-right, 0px))
            max(0.75rem, env(safe-area-inset-bottom, 0px))
            max(0.75rem, env(safe-area-inset-left, 0px));
          color: var(--surface-text, #26343b);
          background: #faf8f5;
        }

        .practice-room__veil {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 48%, rgba(217, 0, 108, 0.12), transparent 36%),
            radial-gradient(circle at 20% 18%, rgba(95, 125, 114, 0.16), transparent 44%),
            radial-gradient(circle at 84% 78%, rgba(64, 82, 90, 0.1), transparent 48%),
            linear-gradient(145deg, rgba(242, 246, 244, 0.64), rgba(241, 236, 229, 0.76) 54%, rgba(250, 248, 245, 0.92));
        }

        .practice-header {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 2.75rem minmax(0, 1fr) 2.75rem;
          align-items: start;
          width: min(100%, 42rem);
          margin-inline: auto;
        }

        .practice-header__copy {
          min-width: 0;
          padding-top: 0.4rem;
          text-align: center;
        }

        .practice-header__eyebrow,
        .practice-header__title,
        .practice-live__caption,
        .practice-live__status,
        .practice-live__error {
          margin: 0;
        }

        .practice-header__eyebrow {
          color: var(--mila-action, #a40050);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          line-height: 1.35;
          text-transform: uppercase;
          text-shadow: none;
        }

        .practice-header__title {
          margin-top: 0.3rem;
          overflow: hidden;
          color: var(--surface-muted, #65535f);
          font-size: clamp(0.84rem, 2.8vw, 1rem);
          font-weight: 500;
          line-height: 1.35;
          text-overflow: ellipsis;
          text-shadow: none;
          white-space: nowrap;
        }

        .practice-header__exit {
          display: grid;
          place-items: center;
          width: 2.75rem;
          height: 2.75rem;
          margin: 0;
          padding: 0;
          border: 1px solid #dde8e3;
          border-radius: 999px;
          color: var(--surface-muted, #40525a);
          background: rgba(250, 248, 245, 0.9);
          cursor: pointer;
          transition: border-color 160ms ease, background 160ms ease;
        }

        .practice-header__exit:hover {
          border-color: #5f7d72;
          color: var(--surface-text, #26343b);
          background: #f2f6f4;
        }

        .practice-header__exit:focus-visible,
        .practice-orb__button:focus-visible {
          outline: 3px solid var(--mila-action, #a40050);
          outline-offset: 4px;
        }

        .practice-orb {
          position: relative;
          z-index: 1;
          display: grid;
          min-width: 0;
          min-height: 0;
          place-items: center;
        }

        .practice-orb__button {
          display: grid;
          place-items: center;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .practice-live {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 0.55rem;
          width: min(100%, 34rem);
          min-height: 3.25rem;
          margin-inline: auto;
          padding: 0.8rem clamp(1rem, 4vw, 1.4rem);
          box-sizing: border-box;
          border: 1px solid #dde8e3;
          border-radius: 1rem;
          color: var(--surface-text, #26343b);
          background: linear-gradient(145deg, rgba(250, 248, 245, 0.96), rgba(242, 246, 244, 0.92));
          box-shadow: 0 14px 36px rgba(38, 52, 59, 0.1);
          text-align: center;
        }

        .practice-live__caption {
          color: var(--surface-text, #26131f);
          font-size: clamp(0.9rem, 3vw, 1rem);
          font-weight: 500;
          line-height: 1.48;
          overflow-wrap: anywhere;
        }

        .practice-live__status {
          color: var(--surface-muted, #65535f);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          line-height: 1.35;
          text-transform: uppercase;
        }

        .practice-live__status--listening {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--mila-action, #a40050);
        }

        .practice-live__status--listening i {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background: var(--mila-action, #a40050);
          box-shadow: 0 0 0 0.28rem rgba(164,0,80,.12);
        }

        .practice-live__status--thinking {
          color: var(--mila-action, #a40050);
        }

        .practice-live__status--speaking {
          color: var(--mila-action, #a40050);
        }

        .practice-live__error {
          color: var(--mila-action, #a40050);
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1.4;
        }

        :global(.practice-room__void) {
          z-index: -2;
          background: #faf8f5;
        }

        :global(.practice-orb__visual) {
          width: clamp(8rem, 42vmin, 18.75rem) !important;
          height: clamp(8rem, 42vmin, 18.75rem) !important;
          max-width: calc(100vw - 2rem);
          max-height: 100%;
        }

        @media (max-height: 560px) and (orientation: landscape) {
          .practice-room {
            grid-template-columns: minmax(9rem, 0.7fr) minmax(12rem, 1fr);
            grid-template-rows: auto minmax(0, 1fr);
            column-gap: clamp(0.75rem, 3vw, 2rem);
            row-gap: 0.35rem;
            padding-block:
              max(0.45rem, env(safe-area-inset-top, 0px))
              max(0.45rem, env(safe-area-inset-bottom, 0px));
          }

          .practice-header {
            grid-column: 1 / -1;
          }

          .practice-orb {
            grid-column: 1;
            grid-row: 2;
          }

          .practice-live {
            align-self: center;
            grid-column: 2;
            grid-row: 2;
            max-height: 100%;
            overflow-y: auto;
          }

          :global(.practice-orb__visual) {
            width: min(35dvh, 11rem) !important;
            height: min(35dvh, 11rem) !important;
          }
        }

        @media (max-width: 360px) {
          .practice-room {
            gap: 0.45rem;
          }

          .practice-header__eyebrow {
            font-size: 0.66rem;
            letter-spacing: 0.12em;
          }

          .practice-live {
            padding: 0.7rem 0.8rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .practice-header__exit {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#faf8f5]" />}>
      <PracticeRoom />
    </Suspense>
  );
}
