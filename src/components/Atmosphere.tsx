'use client';

// Living backdrop — slow crossfading footage behind every page, under a
// dark-glass scrim (globals.css .atmosphere). Route-aware: each area of the app
// draws from its own themed pool, so the mood fits the room —
//   progress/growth  → nature       lessons/library → classrooms + kids
//   conversation rooms → cool young people    landing/auth → the club set
// Clips live in public/ambience (720p, committed). If one fails to load the
// component quietly falls back to pure noir.
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const POOLS: Record<string, string[]> = {
  // calm nature — the growth story
  nature: [
    '/ambience/nature-forest.mp4',   // sunbeams through trees
    '/ambience/nature-lake.mp4',     // mountain lake at dawn
    '/ambience/nature-field.mp4',    // golden-hour meadow
  ],
  // classrooms + children — the learning story
  learn: [
    '/ambience/classroom.mp4',       // children in a classroom
    '/ambience/kids-writing.mp4',    // child learning the alphabet
    '/ambience/study-group.mp4',     // university students together
    '/ambience/library.mp4',         // reading, writing
  ],
  // cool young people — the social story
  social: [
    '/ambience/friends.mp4',         // friends together, laughing
    '/ambience/conversation.mp4',    // talking over coffee
    '/ambience/study-group.mp4',     // students collaborating
    '/ambience/campus.mp4',          // campus walk
  ],
  // the club set — cinematic, for the front door
  club: [
    '/ambience/conversation.mp4',
    '/ambience/library.mp4',
    '/ambience/campus.mp4',
    '/ambience/city-night.mp4',
    '/ambience/nature-lake.mp4',
  ],
};

// Which pool a route draws from (first prefix match wins).
function poolFor(path: string): string[] {
  if (path.startsWith('/progress') || path.startsWith('/achievements')) return POOLS.nature;
  if (path.startsWith('/lessons') || path.startsWith('/vocabulary') || path.startsWith('/phonetics')) return POOLS.learn;
  if (path.startsWith('/listen') || path.startsWith('/chat') || path.startsWith('/darshan') || path.startsWith('/dashboard') || path.startsWith('/assessment')) return POOLS.social;
  return POOLS.club; // '/', '/login', '/register'
}

const HOLD_MS = 22000; // how long each scene breathes before the next

export default function Atmosphere() {
  const pathname = usePathname();
  const clips = poolFor(pathname || '/');
  const [idx, setIdx] = useState(0);
  const [on, setOn] = useState(false);      // current layer visible?
  const [dead, setDead] = useState(false);  // clips unreachable → stay noir
  const vidRef = useRef<HTMLVideoElement>(null);

  // New room → restart the rotation from the top of its pool.
  useEffect(() => { setIdx(0); setOn(false); }, [pathname]);

  useEffect(() => {
    if (dead) return;
    const t = setTimeout(() => {
      setOn(false);
      setTimeout(() => setIdx(i => (i + 1) % clips.length), 2500); // after fade-out
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [idx, dead, clips.length]);

  useEffect(() => {
    const v = vidRef.current;
    if (!v || dead) return;
    // React doesn't reliably reflect the JSX `muted` attr onto the DOM before
    // play() — set it imperatively or autoplay policy blocks the video.
    v.muted = true;
    v.load();
    const play = v.play();
    if (play) play.catch(() => {});
    // Keepalive: browsers opportunistically pause background/covered videos;
    // nudge it back. Cheap (no-op while playing), removes a whole failure class.
    const alive = setInterval(() => {
      const cur = vidRef.current;
      if (cur && cur.paused) { cur.muted = true; cur.play().catch(() => {}); }
    }, 3000);
    return () => clearInterval(alive);
  }, [idx, dead]);

  if (dead) return <div className="atmosphere" aria-hidden />;

  return (
    <div className='atmosphere' aria-hidden>
      <video
        ref={vidRef}
        key={`${pathname}:${idx}`}
        className={on ? 'is-on' : ''}
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={(e) => { setOn(true); const v = e.currentTarget; v.muted = true; v.play().catch(() => {}); }}
        onError={() => { if (idx === 0) setDead(true); else setIdx(0); }}
        src={clips[idx]}
      />
    </div>
  );
}
