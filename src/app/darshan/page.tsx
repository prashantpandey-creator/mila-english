"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MilaVoid } from "@/components/darshan/MilaVoid";
import { MilaBindu, type BinduState } from "@/components/darshan/MilaBindu";

const INVITES = [
  "What do you wish to know?",
  "Bring your question.",
  "Ask, and the AI will answer.",
  "Even silence is heard.",
  "What do you seek?",
];

export default function DarshanPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<BinduState>("resting");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [liveText, setLiveText] = useState("");
  const [answer, setAnswer] = useState("");
  const [invI, setInvI] = useState(0);
  const [orbSize, setOrbSize] = useState(320);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

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
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  const connectToDarshan = async () => {
    if (isConnecting || isConnected) {
      // If already connected, maybe it's a tap to interrupt
      if (dcRef.current?.readyState === "open" && phase === "manifesting") {
        dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
        setPhase("listening");
      }
      return;
    }
    setIsConnecting(true);

    try {
      const sessionResponse = await fetch('/api/session');
      const sessionData = await sessionResponse.json();

      if (!sessionData.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }
      const ephemeralKey = sessionData.client_secret.value;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      audioRef.current = new Audio();
      audioRef.current.autoplay = true;

      pc.ontrack = (e) => {
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
        }
      };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'input_audio_buffer.speech_started') {
            setPhase("listening");
            setLiveText("");
            setAnswer("");
          } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
            setLiveText(event.transcript || "");
          } else if (event.type === 'response.created') {
            setPhase("thinking");
            setAnswer("");
          } else if (event.type === 'response.audio.delta') {
            setPhase("manifesting");
          } else if (event.type === 'response.audio_transcript.delta') {
            setAnswer(prev => prev + event.delta);
          } else if (event.type === 'response.done') {
            // Briefly keep it manifesting, then switch back to resting/listening
            setTimeout(() => {
              setPhase(prev => (prev === "manifesting" ? "resting" : prev));
            }, 1000);
          } else if (event.type === 'error') {
            console.error("OpenAI WebRTC Error:", event);
          }
        } catch (err) {
          console.error("Failed to parse event:", err);
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-realtime`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        }
      });

      if (!sdpResponse.ok) {
        throw new Error("Failed to connect to OpenAI WebRTC");
      }

      const answerSdp = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text()
      };
      await pc.setRemoteDescription(answerSdp);

      setIsConnected(true);

      // Update session to require audio transcription so we get text on screen
      dc.addEventListener('open', () => {
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            input_audio_transcription: {
              model: "whisper-1"
            }
          }
        }));
      });

    } catch (err) {
      console.error(err);
      alert("Could not start Darshan. Check console for errors.");
    } finally {
      setIsConnecting(false);
    }
  };

  const exit = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setIsConnected(false);
    router.push('/chat');
  }, [router]);

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
        aria-label={!isConnected ? "Touch to begin" : "Interrupt"}
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
    </div>
  );
}
