'use client';

// Living backdrop — slow crossfading footage behind every page, under a
// dark-glass scrim (globals.css .atmosphere). It resolves what to show in
// priority order, most specific first:
//   1. COUNTRY  — a page set the scene country (Listen accent: UK→London,
//                 US→New York, IN→Mumbai). The backdrop becomes that place.
//   2. TOPIC    — a page set a situation (airport, hotel…). Show that setting.
//   3. ROUTE    — otherwise draw from the room's themed pool (nature for
//                 progress, classrooms for lessons, social for the talk rooms,
//                 the club set for the front door).
// Clips live in public/ambience (720p, committed). If one fails to load the
// component quietly falls back to pure noir.
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useScene } from '@/lib/scene';

// All clips share ONE warm luminous grade — golden highlights, lifted shadows,
// full saturation, soft vignette. Sourced hi-res (mostly 4K), supersampled to
// 1080p. Aesthetic: beautiful, warm, cinematic — women lead the people pool.
// Each country carries its own tradition, not just a landmark — the backdrop
// gives a "dhyāna" (meditative) sense of the place you're training to enter.
const COUNTRY_POOLS: Record<string, string[]> = {
  uk: ['/ambience/uk-bigben-night.mp4', '/ambience/uk-tower.mp4'],
  us: ['/ambience/us-manhattan.mp4', '/ambience/us-empire.mp4'],
  in: ['/ambience/in-taj-aerial.mp4', '/ambience/in-saree-wedding.mp4', '/ambience/in-saree-dance.mp4', '/ambience/in-diwali.mp4', '/ambience/in-palace.mp4', '/ambience/in-holi.mp4'],
};

const TOPIC_POOLS: Record<string, string[]> = {
  airport:     ['/ambience/us-empire.mp4'],
  hotel:       ['/ambience/venice-night.mp4'],
  cafe:        ['/ambience/woman-coffee.mp4'],
  directions:  ['/ambience/venice-night.mp4'],
  emergencies: ['/ambience/uk-bigben-night.mp4'],
};

const ROUTE_POOLS: Record<string, string[]> = {
  // progress/achievements — awe of nature, warm: golden peaks, aurora, cliffs
  nature: ['/ambience/nature-peaks.mp4', '/ambience/nature-aurora.mp4', '/ambience/nature-cliff.mp4', '/ambience/nature-volcano.mp4'],
  // lessons/study — gothic learning halls, warmly lit: cathedral naves + columns
  learn:  ['/ambience/cathedral-light.mp4', '/ambience/cathedral-columns.mp4', '/ambience/woman-reading.mp4'],
  // the talk/practice rooms — beautiful women: golden field, silk, coffee, flowers
  social: ['/ambience/woman-golden.mp4', '/ambience/woman-silk.mp4', '/ambience/woman-hair.mp4', '/ambience/woman-flowers.mp4', '/ambience/woman-coffee.mp4'],
  // front door / auth — the full sweep, beauty-first
  club:   ['/ambience/woman-golden.mp4', '/ambience/woman-silk.mp4', '/ambience/us-manhattan.mp4', '/ambience/nature-peaks.mp4', '/ambience/venice-night.mp4', '/ambience/cathedral-light.mp4'],
};

function routePool(path: string): string[] {
  if (path.startsWith('/progress') || path.startsWith('/achievements')) return ROUTE_POOLS.nature;
  if (path.startsWith('/lessons') || path.startsWith('/vocabulary') || path.startsWith('/phonetics')) return ROUTE_POOLS.learn;
  if (path.startsWith('/listen') || path.startsWith('/chat') || path.startsWith('/darshan') || path.startsWith('/dashboard') || path.startsWith('/assessment')) return ROUTE_POOLS.social;
  return ROUTE_POOLS.club;
}

const HOLD_MS = 28000; // how long each scene breathes before the next (calm cadence)

// A clip path → its extracted still. Motion belongs only at the front door;
// every inner room shows a frozen graded frame instead.
const stillOf = (clip: string) => clip.replace('/ambience/', '/ambience/stills/').replace('.mp4', '.jpg');

export default function Atmosphere() {
  const pathname = usePathname() || '/';
  const { country, topic } = useScene();

  // Motion ONLY on the front door ('/'). Everywhere else: stills — video is
  // distracting once you're working; a still holds the mood without pulling the eye.
  const motion = pathname === '/';

  // Resolve the active pool, most specific signal wins. A key string lets us
  // reset the rotation whenever the resolved scene changes (tap a new flag →
  // instant new place), without depending on array identity.
  let clips: string[];
  let sceneKey: string;
  if (country && COUNTRY_POOLS[country]) { clips = COUNTRY_POOLS[country]; sceneKey = `c:${country}`; }
  else if (topic && TOPIC_POOLS[topic]) { clips = TOPIC_POOLS[topic]; sceneKey = `t:${topic}`; }
  else { clips = routePool(pathname); sceneKey = `r:${pathname}`; }

  const [idx, setIdx] = useState(0);
  const [on, setOn] = useState(false);
  const [dead, setDead] = useState(false);
  const vidRef = useRef<HTMLVideoElement>(null);

  // New scene → restart rotation from the top of its pool.
  useEffect(() => { setIdx(0); setOn(false); }, [sceneKey]);

  // Gentle rotation through the pool (both stills and the front-door video).
  useEffect(() => {
    if (dead || clips.length < 2) return;
    const t = setTimeout(() => {
      setOn(false);
      setTimeout(() => setIdx(i => (i + 1) % clips.length), 2800);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [idx, dead, clips.length]);

  // Front-door video playback (only when motion is on).
  useEffect(() => {
    if (!motion) return;
    const v = vidRef.current;
    if (!v || dead) return;
    v.muted = true;
    v.load();
    const play = v.play();
    if (play) play.catch(() => {});
    const alive = setInterval(() => {
      const cur = vidRef.current;
      if (cur && cur.paused) { cur.muted = true; cur.play().catch(() => {}); }
    }, 3000);
    return () => clearInterval(alive);
  }, [idx, dead, sceneKey, motion]);

  if (dead) return <div className="atmosphere" aria-hidden />;

  return (
    <div className='atmosphere' aria-hidden>
      {motion ? (
        <video
          ref={vidRef}
          key={`${sceneKey}:${idx}`}
          className={`atmosphere-slow ${on ? 'is-on' : ''}`}
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={(e) => { setOn(true); const v = e.currentTarget; v.muted = true; v.play().catch(() => {}); }}
          onError={() => { if (idx === 0) setDead(true); else setIdx(0); }}
          src={clips[idx]}
        />
      ) : (
        <img
          key={`${sceneKey}:${idx}`}
          className={on ? 'is-on' : ''}
          onLoad={() => setOn(true)}
          onError={() => { if (idx === 0) setDead(true); else setIdx(0); }}
          src={stillOf(clips[idx])}
          alt=""
        />
      )}
    </div>
  );
}
