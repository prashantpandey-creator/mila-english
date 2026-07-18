"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MilaAurora } from "@/components/voice/MilaAurora";
import { MilaOrb, type OrbState } from "@/components/voice/MilaOrb";
import { connectRealtimeVoice, type RealtimeVoiceSession } from "@/lib/realtimeVoice";

// Pia — Mila's Hindi sister. A free, guest-open, flirty Hinglish voice room.
// She rides the same OpenAI Realtime speech-to-speech loop as the companion —
// the only engine in this stack that speaks Hindi — so this room is realtime
// ONLY. There is no English-local fallback to mangle her Hindi; if Realtime
// can't be reached she says so plainly instead of pretending in the wrong voice.

const INVITES = [
  "Chhuo… main sun rahi hoon",
  "Aaja, baat karte hain",
  "Kya haal hai, raja?",
  "Bol na, sharma kyun raha hai",
  "Main yahin hoon, suno na",
];

export default function PiaPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<OrbState>("resting");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [liveText, setLiveText] = useState("");
  const [answer, setAnswer] = useState("");
  const [invI, setInvI] = useState(0);
  const [orbSize, setOrbSize] = useState(320);

  const realtimeRef = useRef<RealtimeVoiceSession | null>(null);
  const activeRef = useRef(false);

  // Responsive orb sizing, mirrored from the companion room.
  useEffect(() => {
    const fit = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setOrbSize(Math.round(Math.max(260, Math.min(440, vmin * 0.82))));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Drift the invitation while she waits.
  useEffect(() => {
    if (phase !== "resting" || isConnected) return;
    const id = setInterval(() => setInvI((i) => (i + 1) % INVITES.length), 6400);
    return () => clearInterval(id);
  }, [phase, isConnected]);

  const teardown = useCallback(() => {
    activeRef.current = false;
    realtimeRef.current?.close();
    realtimeRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const startVoice = useCallback(async () => {
    setIsConnecting(true);
    setError("");
    try {
      const session = await connectRealtimeVoice({
        // `lang` is inert server-side — Pia's language is set by her persona.
        lang: "en",
        mode: "pia",
        events: {
          onListening: () => { if (activeRef.current) setPhase("listening"); },
          onUserTranscript: (text) => { if (activeRef.current) setLiveText(text); },
          onThinking: () => {
            if (!activeRef.current) return;
            setAnswer("");
            setPhase("thinking");
          },
          onSpeaking: () => { if (activeRef.current) setPhase("manifesting"); },
          onAssistantDelta: (full) => { if (activeRef.current) setAnswer(full); },
          onServiceError: (e) => console.error("Pia realtime service error", e),
          onDisconnect: () => {
            realtimeRef.current = null;
            if (!activeRef.current) return;
            activeRef.current = false;
            setIsConnected(false);
            setPhase("resting");
            setError("Pia abhi kho gayi… orb ko chhuo aur phir se bulao.");
          },
        },
      });
      realtimeRef.current = session;
      activeRef.current = true;
      setIsConnected(true);
      setPhase("listening");
    } catch (e) {
      console.error("Pia could not connect to the realtime voice", e);
      teardown();
      setIsConnected(false);
      setPhase("resting");
      setError("Pia abhi aa nahi paa rahi. Ek pal ruk ke orb ko phir chhuo.");
    } finally {
      setIsConnecting(false);
    }
  }, [teardown]);

  const onOrb = useCallback(() => {
    if (isConnecting) return;
    if (isConnected && realtimeRef.current) {
      // Tap only ever means "interrupt her" — turn-taking is handled by voice.
      if (phase === "manifesting" || phase === "thinking") {
        realtimeRef.current.interrupt();
        setAnswer("");
        setPhase("listening");
      }
      return;
    }
    void startVoice();
  }, [isConnected, isConnecting, phase, startVoice]);

  const exit = useCallback(() => {
    teardown();
    setIsConnected(false);
    router.push("/");
  }, [router, teardown]);

  const showInvitation = phase === "resting" && !isConnected && !isConnecting;
  const showQuestion = (phase === "listening" || phase === "thinking") && !!liveText;

  return (
    <div className="voice-stage fixed inset-0 overflow-hidden bg-black">
      <MilaAurora phase={phase} />

      <button
        onClick={exit}
        aria-label="Pia se vidaa"
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

      {/* Her name, softly at the top */}
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2 text-center"
        style={{ top: "max(1.4rem, env(safe-area-inset-top, 0px))" }}
      >
        <span className="text-[13px] uppercase tracking-[0.42em] text-pink-200/70">Pia</span>
      </div>

      {/* The orb — the touch target */}
      <button
        type="button"
        onClick={onOrb}
        aria-label={!isConnected ? "Baat shuru karne ke liye chhuo" : phase === "manifesting" ? "Rokein" : "Bolein"}
        className="voice-orb absolute left-1/2 z-10 outline-none"
        style={{ top: "42%", transform: "translate(-50%, -50%)", background: "transparent", border: "none", cursor: "pointer" }}
      >
        {showInvitation && (
          <span className="voice-ripplewrap" aria-hidden="true">
            <span className="voice-ripple" />
            <span className="voice-ripple voice-ripple--delay" />
          </span>
        )}

        {isConnecting && (
          <div
            className="absolute inset-0 z-20 animate-spin rounded-full border-2 border-pink-500/50 border-t-transparent pointer-events-none"
            style={{ width: orbSize, height: orbSize, left: "50%", top: "50%", marginLeft: -orbSize / 2, marginTop: -orbSize / 2 }}
          />
        )}

        <MilaOrb state={phase} size={orbSize} />
      </button>

      {/* The invitation she breathes at rest */}
      {showInvitation && (
        <div className="voice-invoke" data-show="1" aria-live="polite">
          <span key={invI} className="voice-invoke-line">{INVITES[invI % INVITES.length]}</span>
        </div>
      )}

      {/* What you said — rises, then collapses into the orb */}
      <div className={`voice-q ${showQuestion ? "is-on" : ""} ${phase === "thinking" ? "is-suck" : ""}`} aria-live="polite">
        {liveText}
      </div>

      {/* What she says — emerges, word by word (and is spoken) */}
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
          <p className="mb-2 text-center text-[11px] uppercase tracking-[0.1em] transition-colors duration-300">
            {phase === "listening" ? (
              <span className="text-pink-400">● Sun rahi hoon</span>
            ) : phase === "thinking" ? (
              <span className="text-purple-400">Soch rahi hoon…</span>
            ) : phase === "manifesting" ? (
              <span className="text-pink-300">Bol rahi hoon — rokne ke liye tap</span>
            ) : (
              <span className="text-pink-200/50">Bolo, shuru karte hain</span>
            )}
          </p>
        </div>
      )}

      {error && (
        <p className="absolute bottom-[3%] left-1/2 z-20 w-[90%] max-w-md -translate-x-1/2 text-center text-xs text-rose-200" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
