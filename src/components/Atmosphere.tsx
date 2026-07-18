'use client';

// The commissioned editorial artwork belongs to Mila's front door. Learning
// rooms intentionally keep a quiet white/blush field: no route, country, or
// topic is allowed to re-introduce legacy dark photography behind the UI.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { MILA_ATELIER, visualScenesForRoute } from '@/lib/visualScenes';
import { routeSurfaceForPath } from '@/lib/routeSurface';

const HOLD_MS = 28000; // how long each scene breathes before the next (calm cadence)

type SceneStyle = CSSProperties & {
  '--scene-focus-desktop': string;
  '--scene-focus-mobile': string;
};

export default function Atmosphere() {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);
  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        addEventListener?: (type: string, callback: () => void) => void;
        removeEventListener?: (type: string, callback: () => void) => void;
      };
    }).connection;
    const sync = () => setAllowMotion(!query.matches && !connection?.saveData);
    sync();
    query.addEventListener?.('change', sync);
    connection?.addEventListener?.('change', sync);
    return () => {
      query.removeEventListener?.('change', sync);
      connection?.removeEventListener?.('change', sync);
    };
  }, []);

  // Motion belongs only on the front door. Learning rooms render no media.
  const motion = pathname === '/' && allowMotion;

  const scenes = visualScenesForRoute(pathname);
  const sceneKey = `r:${pathname}`;

  const [idx, setIdx] = useState(0);
  const [on, setOn] = useState(false);
  const [dead, setDead] = useState(false);
  const vidRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New scene → restart rotation from the top of its pool.
  useEffect(() => { setIdx(0); setOn(false); setDead(false); }, [sceneKey]);

  // Gentle rotation through the pool (both stills and the front-door video).
  useEffect(() => {
    // Reduced motion, Save-Data, and focused learning rooms hold one stable
    // poster. Rotation belongs to the front-door motion treatment only.
    if (!motion || dead || scenes.length < 2) return;
    const t = setTimeout(() => {
      setOn(false);
      fadeTimerRef.current = setTimeout(() => setIdx(i => (i + 1) % scenes.length), 2800);
    }, HOLD_MS);
    return () => {
      clearTimeout(t);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [idx, dead, motion, scenes.length]);

  const activeScene = scenes[idx] ?? scenes[0] ?? MILA_ATELIER;
  const playVideo = motion && Boolean(activeScene.video);
  const sceneStyle: SceneStyle = {
    '--scene-focus-desktop': activeScene.focusDesktop ?? 'center center',
    '--scene-focus-mobile': activeScene.focusMobile ?? activeScene.focusDesktop ?? 'center center',
  };

  // Cached images can finish before React attaches onLoad. Reconcile that
  // fast path after a scene change so a warm-cache visit never stays black.
  useEffect(() => {
    const image = imgRef.current;
    if (playVideo || !image) return;
    let active = true;
    const reveal = () => {
      if (active && image.naturalWidth > 0) setOn(true);
    };
    if (image.complete) reveal();
    else image.addEventListener('load', reveal);
    image.decode?.().then(reveal).catch(() => {});
    return () => {
      active = false;
      image.removeEventListener('load', reveal);
    };
  }, [activeScene.id, playVideo, sceneKey]);

  // Front-door video playback (only when motion is on).
  useEffect(() => {
    if (!playVideo) return;
    const v = vidRef.current;
    if (!v || dead) return;
    v.muted = true;
    v.load();
    const syncPlayback = () => {
      const current = vidRef.current;
      if (!current) return;
      if (document.hidden) current.pause();
      else current.play().catch(() => {});
    };
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      document.removeEventListener('visibilitychange', syncPlayback);
      v.pause();
    };
  }, [activeScene.id, dead, playVideo]);

  if (pathname !== '/' || dead) return <div className={`atmosphere atmosphere--${surface}`} aria-hidden />;

  return (
    <div className={`atmosphere atmosphere--${activeScene.grade ?? 'quiet'} atmosphere--${surface} atmosphere--front ${motion ? 'atmosphere--motion' : ''}`} aria-hidden>
      {playVideo ? (
        <video
          ref={vidRef}
          key={`${sceneKey}:${idx}`}
          className={`atmosphere-slow ${on ? 'is-on' : ''}`}
          style={sceneStyle}
          muted
          loop
          playsInline
          preload="metadata"
          poster={activeScene.stillDesktop}
          onCanPlay={(e) => { setOn(true); const v = e.currentTarget; v.muted = true; if (!document.hidden) v.play().catch(() => {}); }}
          onError={() => { if (idx === 0) setDead(true); else setIdx(0); }}
          src={activeScene.video}
        />
      ) : (
        <picture key={`${sceneKey}:${idx}`}>
          {activeScene.stillMobile && <source media="(max-width: 640px)" srcSet={activeScene.stillMobile} />}
          <img
            ref={imgRef}
            className={`${motion ? 'atmosphere-slow ' : ''}${on ? 'is-on' : ''}`}
            style={sceneStyle}
            onLoad={() => setOn(true)}
            onError={() => { if (idx === 0) setDead(true); else setIdx(0); }}
            src={activeScene.stillDesktop}
            alt=""
            decoding="async"
            fetchPriority={pathname === '/' ? 'high' : 'auto'}
          />
        </picture>
      )}
    </div>
  );
}
