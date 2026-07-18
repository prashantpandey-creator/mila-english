'use client';

// The commissioned editorial artwork belongs to Mila's front door. Learning
// rooms intentionally keep a quiet white/blush field: no route, country, or
// topic is allowed to re-introduce legacy dark photography behind the UI.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { MILA_ATELIER, visualScenesForRoute } from '@/lib/visualScenes';
import { routeSurfaceForPath } from '@/lib/routeSurface';

const HOLD_MS = 28000; // how long each scene breathes before the next (calm cadence)
const ROTOSCOPE_SESSION_KEY = 'mila:graphite-reveal:v1';

type MotionMode = 'pending' | 'on' | 'off';
type RotoscopePhase = 'loading' | 'sketch' | 'developing' | 'complete';

type SceneStyle = CSSProperties & {
  '--scene-focus-desktop': string;
  '--scene-focus-mobile': string;
};

export default function Atmosphere() {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);
  const [motionMode, setMotionMode] = useState<MotionMode>('pending');

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        addEventListener?: (type: string, callback: () => void) => void;
        removeEventListener?: (type: string, callback: () => void) => void;
      };
    }).connection;
    const sync = () => setMotionMode(!query.matches && !connection?.saveData ? 'on' : 'off');
    sync();
    query.addEventListener?.('change', sync);
    connection?.addEventListener?.('change', sync);
    return () => {
      query.removeEventListener?.('change', sync);
      connection?.removeEventListener?.('change', sync);
    };
  }, []);

  // Motion belongs only on the front door. Learning rooms render no media.
  const motion = pathname === '/' && motionMode === 'on';

  const scenes = visualScenesForRoute(pathname);
  const sceneKey = `r:${pathname}`;

  const [idx, setIdx] = useState(0);
  const [on, setOn] = useState(false);
  const [dead, setDead] = useState(false);
  const [colorFailed, setColorFailed] = useState(false);
  const [sketchReady, setSketchReady] = useState(false);
  const [sketchFailed, setSketchFailed] = useState(false);
  const [rotoscopeEligible, setRotoscopeEligible] = useState(false);
  const [rotoscopePhase, setRotoscopePhase] = useState<RotoscopePhase>('loading');
  const vidRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sketchRef = useRef<HTMLImageElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New scene → restart rotation from the top of its pool.
  useEffect(() => {
    setIdx(0);
    setOn(false);
    setDead(false);
    setColorFailed(false);
    setSketchReady(false);
    setSketchFailed(false);
    setRotoscopeEligible(false);
    setRotoscopePhase('loading');
  }, [sceneKey]);

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
  const renderSketch = Boolean(activeScene.sketchDesktop) && (rotoscopeEligible || colorFailed);
  const sceneStyle: SceneStyle = {
    '--scene-focus-desktop': activeScene.focusDesktop ?? 'center center',
    '--scene-focus-mobile': activeScene.focusMobile ?? activeScene.focusDesktop ?? 'center center',
  };

  // The graphite-to-electric entrance is intentionally a once-per-session
  // welcome. `?replay=rotoscope` exists only for visual QA and art direction.
  useEffect(() => {
    if (pathname !== '/' || motionMode === 'pending') return;
    if (motionMode === 'off' || !activeScene.sketchDesktop) {
      setRotoscopeEligible(false);
      setRotoscopePhase('complete');
      return;
    }

    const forceReplay = new URLSearchParams(window.location.search).get('replay') === 'rotoscope';
    let seen = false;
    try { seen = window.sessionStorage.getItem(ROTOSCOPE_SESSION_KEY) === '1'; } catch { /* privacy mode */ }
    const eligible = forceReplay || !seen;
    setRotoscopeEligible(eligible);
    setRotoscopePhase(eligible ? 'loading' : 'complete');
  }, [activeScene.id, activeScene.sketchDesktop, motionMode, pathname]);

  // Cached images can finish before React attaches onLoad. Reconcile that
  // fast path after a scene change so a warm-cache visit never stays black.
  useEffect(() => {
    const image = imgRef.current;
    if (playVideo || !image) return;
    let active = true;
    const reveal = () => {
      if (active && image.naturalWidth > 0) {
        setColorFailed(false);
        setOn(true);
      }
    };
    if (image.complete) reveal();
    else image.addEventListener('load', reveal);
    image.decode?.().then(reveal).catch(() => {});
    return () => {
      active = false;
      image.removeEventListener('load', reveal);
    };
  }, [activeScene.id, playVideo, sceneKey]);

  // Reconcile the graphite layer independently. A failed or slow sketch must
  // never hold the permanent electric artwork hostage.
  useEffect(() => {
    const image = sketchRef.current;
    if (!renderSketch || !image) return;
    let active = true;
    const reveal = () => {
      if (active && image.naturalWidth > 0) {
        setSketchFailed(false);
        setSketchReady(true);
      }
    };
    if (image.complete) reveal();
    else image.addEventListener('load', reveal);
    image.decode?.().then(reveal).catch(() => {});
    return () => {
      active = false;
      image.removeEventListener('load', reveal);
    };
  }, [activeScene.id, renderSketch, sceneKey]);

  // Hold the handmade drawing just long enough to register, then let colour
  // develop outward from the waveform. Mobile is deliberately quicker.
  useEffect(() => {
    if (!rotoscopeEligible || motionMode !== 'on') return;
    if (sketchFailed) {
      setRotoscopeEligible(false);
      setRotoscopePhase('complete');
      return;
    }
    if (colorFailed && sketchReady) {
      setRotoscopePhase('sketch');
      return;
    }
    if (!on || !sketchReady) return;

    setRotoscopePhase('sketch');
    const hold = window.matchMedia('(max-width: 640px)').matches ? 220 : 360;
    const timer = window.setTimeout(() => {
      try { window.sessionStorage.setItem(ROTOSCOPE_SESSION_KEY, '1'); } catch { /* privacy mode */ }
      setRotoscopePhase('developing');
    }, hold);
    return () => window.clearTimeout(timer);
  }, [colorFailed, motionMode, on, rotoscopeEligible, sketchFailed, sketchReady]);

  // On a weak connection the colour hero remains the fallback after one short
  // attempt; repeated visits will not keep paying for an entrance that missed.
  useEffect(() => {
    if (!rotoscopeEligible || !on || sketchReady || sketchFailed) return;
    const timer = window.setTimeout(() => {
      try { window.sessionStorage.setItem(ROTOSCOPE_SESSION_KEY, '1'); } catch { /* privacy mode */ }
      setRotoscopeEligible(false);
      setRotoscopePhase('complete');
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [on, rotoscopeEligible, sketchFailed, sketchReady]);

  // Interaction wins over decoration, including while the sketch is loading.
  // Scrolling or engaging the page settles immediately into the final electric
  // still and never blocks navigation.
  useEffect(() => {
    if (!rotoscopeEligible || rotoscopePhase === 'complete') return;
    const finish = () => {
      try { window.sessionStorage.setItem(ROTOSCOPE_SESSION_KEY, '1'); } catch { /* privacy mode */ }
      setRotoscopeEligible(false);
      setRotoscopePhase('complete');
    };
    window.addEventListener('scroll', finish, { passive: true, once: true });
    window.addEventListener('pointerdown', finish, { once: true });
    window.addEventListener('keydown', finish, { once: true });
    return () => {
      window.removeEventListener('scroll', finish);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
    };
  }, [rotoscopeEligible, rotoscopePhase]);

  // Animation events can be deferred in background tabs. Keep the decorative
  // layer from lingering if the browser never delivers animationend.
  useEffect(() => {
    if (rotoscopePhase !== 'developing') return;
    const timer = window.setTimeout(() => {
      setRotoscopeEligible(false);
      setRotoscopePhase('complete');
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [rotoscopePhase]);

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
    <div
      className={`atmosphere atmosphere--${activeScene.grade ?? 'quiet'} atmosphere--${surface} atmosphere--front ${motion ? 'atmosphere--motion' : ''}`}
      data-motion={motionMode}
      data-rotoscope={rotoscopePhase}
      data-color-failed={colorFailed ? 'true' : 'false'}
      aria-hidden
    >
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
        <div className="atmosphere__still-stack" key={`${sceneKey}:${idx}`}>
          {renderSketch && activeScene.sketchDesktop && (
            <picture className="atmosphere__layer atmosphere__layer--sketch">
              {activeScene.sketchMobile && <source media="(max-width: 640px)" srcSet={activeScene.sketchMobile} />}
              <img
                ref={sketchRef}
                className={`atmosphere-rotoscope__sketch ${sketchReady ? 'is-ready' : ''}`}
                style={sceneStyle}
                onLoad={() => setSketchReady(true)}
                onError={() => {
                  setSketchFailed(true);
                  setRotoscopeEligible(false);
                  setRotoscopePhase('complete');
                  if (colorFailed) setDead(true);
                }}
                src={activeScene.sketchDesktop}
                alt=""
                decoding="async"
                fetchPriority="high"
              />
            </picture>
          )}

          <picture
            className="atmosphere__layer atmosphere__layer--electric"
            onAnimationEnd={(event) => {
              if (
                event.currentTarget !== event.target ||
                !['milaElectricDevelop', 'milaElectricDevelopMobile'].includes(event.animationName)
              ) return;
              setRotoscopeEligible(false);
              setRotoscopePhase('complete');
            }}
          >
            {activeScene.stillMobile && <source media="(max-width: 640px)" srcSet={activeScene.stillMobile} />}
            <img
              ref={imgRef}
              className={`${motion ? 'atmosphere-slow ' : ''}${on ? 'is-on' : ''}`}
              style={sceneStyle}
              onLoad={() => { setColorFailed(false); setOn(true); }}
              onError={() => {
                setColorFailed(true);
                if (!activeScene.sketchDesktop || sketchFailed) {
                  if (idx === 0) setDead(true); else setIdx(0);
                }
              }}
              src={activeScene.stillDesktop}
              alt=""
              decoding="async"
              fetchPriority={renderSketch ? 'auto' : pathname === '/' ? 'high' : 'auto'}
            />
          </picture>

          {renderSketch && (
            <svg className="atmosphere-rotoscope__trace" viewBox="0 0 1000 240" preserveAspectRatio="none" aria-hidden>
              <path
                pathLength="1"
                d="M0 120 L82 120 L110 111 L126 144 L145 78 L166 176 L188 120 L232 120 L250 102 L270 151 L292 52 L314 194 L337 120 L382 120 L399 91 L417 160 L438 70 L459 181 L481 120 L530 120 L548 104 L566 145 L584 82 L603 170 L624 120 L670 120 L690 96 L710 158 L730 62 L750 186 L773 120 L820 120 L842 106 L860 142 L878 88 L897 166 L918 120 L1000 120"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
