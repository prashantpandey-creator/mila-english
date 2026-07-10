'use client';

// Living backdrop — slow crossfading footage of people studying, talking,
// city light. Sits behind every page under a dark-glass scrim (globals.css
// .atmosphere). Clips live in public/ambience (720p, ~7MB total, committed);
// if one fails to load the component quietly falls back to pure noir.
import { useEffect, useRef, useState } from 'react';

const CLIPS = [
  '/ambience/conversation.mp4',   // colleagues talking over coffee
  '/ambience/library.mp4',        // student reading, writing
  '/ambience/campus.mp4',         // university walk, Greenwich
  '/ambience/meeting.mp4',        // office conversation
  '/ambience/city-night.mp4',     // London skyline after dark
];

const HOLD_MS = 22000; // how long each scene breathes before the next

export default function Atmosphere({ bright = false }: { bright?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [on, setOn] = useState(false);      // current layer visible?
  const [dead, setDead] = useState(false);  // clips unreachable → stay noir
  const vidRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (dead) return;
    const t = setTimeout(() => {
      setOn(false);
      setTimeout(() => setIdx(i => (i + 1) % CLIPS.length), 2500); // after fade-out
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [idx, dead]);

  useEffect(() => {
    const v = vidRef.current;
    if (!v || dead) return;
    v.load();
    const play = v.play();
    if (play) play.catch(() => {}); // autoplay policies — muted, should pass
  }, [idx, dead]);

  if (dead) return <div className="atmosphere" aria-hidden />;

  return (
    <div className={`atmosphere${bright ? ' atmosphere--bright' : ''}`} aria-hidden>
      <video
        ref={vidRef}
        key={idx}
        className={on ? 'is-on' : ''}
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={() => setOn(true)}
        onError={() => { if (idx === 0) setDead(true); else setIdx(0); }}
        src={CLIPS[idx]}
      />
    </div>
  );
}
