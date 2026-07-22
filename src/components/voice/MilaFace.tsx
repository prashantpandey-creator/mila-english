"use client";

import { useEffect, useState } from "react";
import type { OrbState } from "./MilaOrb";

/**
 * MilaFace — the photoreal voice presence. A circular window onto a real-looking
 * Mila: a calm, living idle loop ringed by a state-coloured halo that pulses while
 * she speaks. Same {state,size} interface as MilaOrb / MilaKid, so it drops straight
 * into the voice room behind the ?face=1 flag.
 *
 * The clip is pre-rendered, fully self-hosted (RealVisXL face → LivePortrait motion,
 * on our own GPU — never a third-party service). Voice STATE is carried by the ring
 * and the existing labels, per the design system — the face is never a route-specific
 * skin, and the ring is an honest "Mila is speaking now" cue, NOT a claim of
 * phoneme-accurate lip-sync. True real-time lip-sync (MuseTalk streaming) replaces
 * the idle loop with a live talking stream later; this is the presence it slots into.
 *
 * Falls back to the still poster under prefers-reduced-motion / Save-Data (no video
 * fetch, no motion) so the low-bandwidth Russia path stays light.
 */

const IDLE_SRC = "/avatar/mila-idle.mp4";
const POSTER = "/avatar/mila-idle.jpg";

// State → ring colour, drawn from the Mineral Paper palette.
const RING: Record<OrbState, string> = {
  resting: "rgba(120, 138, 138, 0.30)", // muted mineral, barely there
  listening: "rgba(69, 106, 96, 0.85)", // eucalyptus — hearing you
  thinking: "rgba(38, 52, 59, 0.68)", // graphite — reflecting
  manifesting: "rgba(217, 0, 108, 0.92)", // magenta — Mila's signature, speaking
};

export function MilaFace({
  state = "resting",
  size = 320,
  className,
  ariaLabel = "Mila",
}: {
  state?: OrbState;
  size?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const [lowMotion, setLowMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    setLowMotion(reduced || !!conn?.saveData);
  }, []);

  const ring = RING[state];
  const dim = `${size}px`;

  return (
    <span
      className={`mila-face mila-face--${state}${className ? ` ${className}` : ""}`}
      style={{
        width: dim,
        height: dim,
        display: "inline-block",
        position: "relative",
        borderRadius: "50%",
        boxShadow: `0 0 0 3px ${ring}, 0 0 46px -6px ${ring}, 0 24px 60px -28px rgba(38,52,59,0.55)`,
        transition: "box-shadow .5s cubic-bezier(.2,.8,.2,1), transform .5s cubic-bezier(.2,.8,.2,1)",
        transform: state === "listening" ? "scale(1.02)" : "scale(1)",
        overflow: "hidden",
        background: "#f3f6f7",
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {/* A magenta breath while she speaks — the honest "speaking now" cue. */}
      <style>{`
        .mila-face--manifesting { animation: milaFaceSpeak 1.15s ease-in-out infinite; }
        @keyframes milaFaceSpeak {
          0%, 100% { box-shadow: 0 0 0 3px ${RING.manifesting}, 0 0 40px -8px ${RING.manifesting}, 0 24px 60px -28px rgba(38,52,59,0.55); }
          50% { box-shadow: 0 0 0 4px ${RING.manifesting}, 0 0 66px -2px ${RING.manifesting}, 0 24px 60px -28px rgba(38,52,59,0.55); }
        }
        @media (prefers-reduced-motion: reduce) { .mila-face--manifesting { animation: none; } }
      `}</style>

      {lowMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={POSTER}
          alt={ariaLabel}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <video
          src={IDLE_SRC}
          poster={POSTER}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </span>
  );
}
