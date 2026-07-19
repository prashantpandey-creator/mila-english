'use client';

// The commissioned editorial artwork belongs to Mila's front door. Learning
// rooms intentionally keep a quiet mineral-paper field: no route, country, or
// topic is allowed to re-introduce legacy dark photography behind the UI.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import AtmosphereStory, {
  STORY_SESSION_KEY,
  type AtmosphereStoryHandle,
} from '@/components/AtmosphereStory';
import { MILA_ATELIER, MILA_VOICE_ORIGIN_STORY } from '@/lib/visualScenes';
import { routeSurfaceForPath } from '@/lib/routeSurface';

type MotionMode = 'pending' | 'on' | 'off';
type StoryEligibility = 'pending' | 'play' | 'skip';

type SceneStyle = CSSProperties & {
  '--scene-focus-desktop': string;
  '--scene-focus-mobile': string;
};

export default function Atmosphere() {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);
  const [motionMode, setMotionMode] = useState<MotionMode>('pending');
  const [storyEligibility, setStoryEligibility] = useState<StoryEligibility>('pending');
  const [imageReady, setImageReady] = useState(false);
  const [colorFailed, setColorFailed] = useState(false);
  const [dead, setDead] = useState(false);
  const [storyActive, setStoryActive] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const storyRef = useRef<AtmosphereStoryHandle>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        addEventListener?: (type: string, callback: () => void) => void;
        removeEventListener?: (type: string, callback: () => void) => void;
      };
    }).connection;
    const sync = () => {
      const enabled = !query.matches && !connection?.saveData;
      setMotionMode(enabled ? 'on' : 'off');

      if (pathname !== '/' || !enabled) {
        setStoryEligibility('skip');
        return;
      }

      const forceReplay = new URLSearchParams(window.location.search).get('replay') === 'rotoscope';
      let seen = false;
      try { seen = window.sessionStorage.getItem(STORY_SESSION_KEY) === '1'; } catch { /* privacy mode */ }
      setStoryEligibility(forceReplay || !seen ? 'play' : 'skip');
    };
    sync();
    query.addEventListener?.('change', sync);
    connection?.addEventListener?.('change', sync);
    return () => {
      query.removeEventListener?.('change', sync);
      connection?.removeEventListener?.('change', sync);
    };
  }, [pathname]);

  useEffect(() => {
    setImageReady(false);
    setColorFailed(false);
    setDead(false);
    setStoryActive(false);
  }, [pathname]);

  // Cached images can finish before React attaches onLoad. Reconcile that
  // path so a warm-cache visit never stays on the paper-colour fallback.
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    let current = true;
    const reveal = () => {
      if (current && image.naturalWidth > 0) setImageReady(true);
    };
    if (image.complete) reveal();
    else image.addEventListener('load', reveal);
    image.decode?.().then(reveal).catch(() => {});
    return () => {
      current = false;
      image.removeEventListener('load', reveal);
    };
  }, [colorFailed, pathname]);

  const onStoryActiveChange = useCallback((active: boolean) => {
    setStoryActive(active);
  }, []);

  useEffect(() => {
    if (storyActive) document.documentElement.dataset.milaStoryActive = 'true';
    else delete document.documentElement.dataset.milaStoryActive;
    return () => {
      delete document.documentElement.dataset.milaStoryActive;
    };
  }, [storyActive]);

  if (pathname !== '/' || dead) {
    return <div className={`atmosphere atmosphere--${surface}`} aria-hidden />;
  }

  const motion = motionMode === 'on';
  const playStory = motion && storyEligibility === 'play';
  const desktopSource = colorFailed ? MILA_ATELIER.sketchDesktop : MILA_ATELIER.stillDesktop;
  const mobileSource = colorFailed ? MILA_ATELIER.sketchMobile : MILA_ATELIER.stillMobile;
  const sceneStyle: SceneStyle = {
    '--scene-focus-desktop': MILA_ATELIER.focusDesktop ?? 'center center',
    '--scene-focus-mobile': MILA_ATELIER.focusMobile ?? MILA_ATELIER.focusDesktop ?? 'center center',
  };

  return (
    <>
      <div
        className={`atmosphere atmosphere--${MILA_ATELIER.grade ?? 'quiet'} atmosphere--${surface} atmosphere--front ${motion ? 'atmosphere--motion' : ''}`}
        data-motion={motionMode}
        data-story={storyActive ? 'active' : 'complete'}
        data-color-failed={colorFailed ? 'true' : 'false'}
        aria-hidden
      >
        <div className="atmosphere__still-stack">
          <picture className="atmosphere__layer atmosphere__layer--electric" key={colorFailed ? 'graphite-fallback' : 'electric'}>
            {mobileSource && <source media="(max-width: 640px)" srcSet={mobileSource} />}
            <img
              ref={imageRef}
              className={imageReady ? 'is-on' : ''}
              style={sceneStyle}
              onLoad={() => setImageReady(true)}
              onError={() => {
                if (!colorFailed && MILA_ATELIER.sketchDesktop) {
                  setImageReady(false);
                  setColorFailed(true);
                } else {
                  setDead(true);
                }
              }}
              src={desktopSource}
              alt=""
              decoding="async"
              fetchPriority="high"
            />
          </picture>

          {playStory && (
            <AtmosphereStory
              ref={storyRef}
              frames={MILA_VOICE_ORIGIN_STORY}
              onActiveChange={onStoryActiveChange}
            />
          )}
        </div>
      </div>

      {storyActive && (
        <button
          type="button"
          className="atmosphere-story__skip"
          onClick={() => storyRef.current?.finish()}
          aria-label="Skip Mila story / Пропустить историю Mila"
          data-story-skip
        >
          Skip / Пропустить
        </button>
      )}
    </>
  );
}
