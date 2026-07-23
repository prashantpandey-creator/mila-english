"use client";

import { useEffect, useId, useState } from "react";
import type { OrbState } from "./MilaOrb";

/**
 * MilaKid — the cute, reactive cartoon buddy for the children's voice mode.
 * A round pink friend with big sparkly eyes, rosy cheeks and a little heart
 * sprout, that gently floats, blinks, leans in when it's listening, thinks with
 * sparkles, and opens its mouth while Mila is speaking. Same {state,size}
 * interface as MilaOrb, so it drops straight into the voice room.
 *
 * All motion is CSS + one JS blink timer (no WebGL) so it is light on a phone,
 * and it falls still under prefers-reduced-motion.
 */
export function MilaKid({
  state = "resting",
  size = 260,
  className,
  ariaLabel = "Mila",
}: {
  state?: OrbState;
  size?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let timer: number;
    const loop = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 130);
        // The occasional playful double-blink.
        if (Math.random() < 0.22) {
          window.setTimeout(() => setBlink(true), 250);
          window.setTimeout(() => setBlink(false), 380);
        }
        loop();
      }, 2200 + Math.random() * 3400);
    };
    loop();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span
      className={`mila-kid mila-kid--${state}${blink ? " is-blink" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size, display: "inline-block" }}
      role="img"
      aria-label={ariaLabel}
    >
      <style>{`
        .mk-${uid}{width:100%;height:100%;display:block;overflow:visible}
        .mk-${uid} [class^="mk-x-"]{transform-box:fill-box;transform-origin:center}
        .mk-float-${uid}{animation:mkFloat${uid} 3.6s ease-in-out infinite}
        .mila-kid--listening .mk-float-${uid}{animation-duration:2.4s}
        .mila-kid--manifesting .mk-float-${uid}{animation-duration:1.4s}
        @keyframes mkFloat${uid}{0%,100%{transform:translateY(3px)}50%{transform:translateY(-9px)}}
        .mk-tilt-${uid}{transition:transform .45s cubic-bezier(.2,.8,.2,1)}
        .mila-kid--thinking .mk-tilt-${uid}{transform:rotate(-8deg)}
        .mila-kid--listening .mk-tilt-${uid}{transform:scale(1.03)}
        .mk-x-eyes-${uid}{transition:transform .3s ease}
        .mila-kid--listening .mk-x-eyes-${uid}{transform:scale(1.08)}
        .mk-x-eye-${uid}{transition:transform .1s ease}
        .is-blink .mk-x-eye-${uid}{transform:scaleY(.08)}
        .mk-x-sprout-${uid}{animation:mkSprout${uid} 2.6s ease-in-out infinite}
        @keyframes mkSprout${uid}{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
        .mk-mouth-smile-${uid}{transition:opacity .12s}
        .mk-x-mouth-talk-${uid}{opacity:0}
        .mila-kid--manifesting .mk-mouth-smile-${uid}{opacity:0}
        .mila-kid--manifesting .mk-x-mouth-talk-${uid}{opacity:1;animation:mkTalk${uid} .3s ease-in-out infinite}
        @keyframes mkTalk${uid}{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
        .mk-x-spark-${uid}{opacity:0}
        .mila-kid--thinking .mk-x-spark-${uid}{opacity:1;animation:mkSpark${uid} 1.5s ease-in-out infinite}
        @keyframes mkSpark${uid}{0%,100%{opacity:.15;transform:translateY(2px) scale(.9)}50%{opacity:1;transform:translateY(-4px) scale(1)}}
        @media (prefers-reduced-motion: reduce){
          .mk-float-${uid},.mk-x-sprout-${uid},.mila-kid--manifesting .mk-x-mouth-talk-${uid},.mila-kid--thinking .mk-x-spark-${uid}{animation:none!important}
        }
      `}</style>
      <svg viewBox="0 0 200 200" className={`mk-${uid}`} aria-hidden="true">
        <defs>
          <radialGradient id={`glow${uid}`} cx="50%" cy="44%" r="60%">
            <stop offset="0%" stopColor="#ffd6ec" stopOpacity="0.85" />
            <stop offset="68%" stopColor="#ffe9d6" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`body${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff4fc" />
            <stop offset="55%" stopColor="#ffd9ee" />
            <stop offset="100%" stopColor="#ffbfe2" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="106" r="96" fill={`url(#glow${uid})`} />

        <g className={`mk-float-${uid}`}>
          <g className={`mk-tilt-${uid}`}>
            {/* heart sprout on top */}
            <g className={`mk-x-sprout-${uid}`} style={{ transformOrigin: "100px 58px" }}>
              <path d="M100 58 Q97 44 100 34" stroke="#ff82c2" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M100 40 C96 33 87 34 88 42 C89 49 100 55 100 55 C100 55 111 49 112 42 C113 34 104 33 100 40 Z" fill="#ff5fa8" />
            </g>

            {/* body */}
            <ellipse cx="100" cy="114" rx="72" ry="66" fill={`url(#body${uid})`} stroke="#ffffff" strokeWidth="6" />
            <ellipse cx="100" cy="114" rx="72" ry="66" fill="none" stroke="#ff9dd0" strokeWidth="2.5" opacity="0.65" />

            {/* rosy cheeks */}
            <circle cx="63" cy="124" r="12" fill="#ff87c0" opacity="0.5" />
            <circle cx="137" cy="124" r="12" fill="#ff87c0" opacity="0.5" />

            {/* eyes */}
            <g className={`mk-x-eyes-${uid}`}>
              <g className={`mk-x-eye-${uid}`}>
                <ellipse cx="79" cy="102" rx="15" ry="18" fill="#fff" />
                <circle cx="81" cy="105" r="8.5" fill="#3a2b4d" />
                <circle cx="84" cy="101" r="3" fill="#fff" />
                <circle cx="77" cy="109" r="1.6" fill="#fff" opacity="0.85" />
              </g>
              <g className={`mk-x-eye-${uid}`}>
                <ellipse cx="121" cy="102" rx="15" ry="18" fill="#fff" />
                <circle cx="119" cy="105" r="8.5" fill="#3a2b4d" />
                <circle cx="122" cy="101" r="3" fill="#fff" />
                <circle cx="116" cy="109" r="1.6" fill="#fff" opacity="0.85" />
              </g>
            </g>

            {/* mouth: happy smile (default) → open mouth (talking) */}
            <path className={`mk-mouth-smile-${uid}`} d="M84 134 Q100 149 116 134" stroke="#d9006c" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <g className={`mk-x-mouth-talk-${uid}`} style={{ transformOrigin: "100px 136px" }}>
              <ellipse cx="100" cy="136" rx="13" ry="12" fill="#c1145e" />
              <ellipse cx="100" cy="141" rx="7" ry="5" fill="#ff8fb0" />
            </g>

            {/* thinking sparkles */}
            <g className={`mk-x-spark-${uid}`}>
              <circle cx="152" cy="72" r="3.6" fill="#ffcf3f" />
              <circle cx="166" cy="86" r="2.4" fill="#ff9d2f" />
              <circle cx="158" cy="58" r="2" fill="#ff82c2" />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}
