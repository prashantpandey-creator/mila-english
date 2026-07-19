'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  HERO_STORY_FILM_MS,
  HERO_STORY_REVEAL_MS,
} from '@/lib/heroStory';
import type { VisualStoryFilm } from '@/lib/visualScenes';

export const STORY_SESSION_KEY = 'mila:voice-origin-story:v4';
const STORY_SESSION_COOKIE = 'mila_voice_origin_story_v4';
const READINESS_BUDGET_MS = 7000;
const PLAYBACK_GRACE_MS = 3000;
const STALL_BUDGET_MS = 2500;
const MOBILE_FILM_QUERY = '(max-width: 1100px) and (orientation: portrait)';

let storySeenInMemory = false;

export function hasSeenAtmosphereStory(): boolean {
  if (storySeenInMemory) return true;
  try {
    storySeenInMemory = window.sessionStorage.getItem(STORY_SESSION_KEY) === '1';
  } catch {
    // Continue to the session-cookie fallback below.
  }
  if (!storySeenInMemory) {
    try {
      storySeenInMemory = document.cookie
        .split('; ')
        .some((entry) => entry === `${STORY_SESSION_COOKIE}=1`);
    } catch {
      // The module-level fallback still prevents replay on a client remount.
    }
  }
  return storySeenInMemory;
}

function markAtmosphereStorySeen(): void {
  storySeenInMemory = true;
  let stored = false;
  try {
    window.sessionStorage.setItem(STORY_SESSION_KEY, '1');
    stored = true;
  } catch {
    // Continue to the session-cookie fallback below.
  }
  if (!stored) {
    try {
      document.cookie = `${STORY_SESSION_COOKIE}=1; Path=/; SameSite=Lax`;
    } catch {
      // The module-level fallback above still prevents a replay on remount.
    }
  }
}

export type AtmosphereStoryHandle = {
  finish: () => void;
};

type AtmosphereStoryProps = {
  film: VisualStoryFilm;
  onActiveChange: (active: boolean) => void;
};

type StoryPhase = 'loading' | 'playing' | 'revealing' | 'complete';

const AtmosphereStory = forwardRef<AtmosphereStoryHandle, AtmosphereStoryProps>(
  function AtmosphereStory({ film, onActiveChange }, ref) {
    const [phase, setPhase] = useState<StoryPhase>('loading');
    const videoRef = useRef<HTMLVideoElement>(null);
    const finishRef = useRef<() => void>(() => {});

    useImperativeHandle(ref, () => ({ finish: () => finishRef.current() }), []);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const storyVideo: HTMLVideoElement = video;

      const mediaQuery = window.matchMedia(MOBILE_FILM_QUERY);
      const selectedSource = mediaQuery.matches ? film.mobile : film.desktop;
      const selectedPoster = mediaQuery.matches ? film.posterMobile : film.posterDesktop;
      const initialScrollX = window.scrollX;
      const initialScrollY = window.scrollY;
      let readinessTimer = 0;
      let playbackTimer = 0;
      let revealTimer = 0;
      let stallTimer = 0;
      let finished = false;
      let starting = false;
      let playbackStarted = false;
      let waitingForProgress = false;
      let lastMediaTime = 0;
      let revealing = false;

      const isInteractiveTarget = (target: EventTarget | null) => (
        target instanceof Element
        && Boolean(target.closest(
          'a,button,input,textarea,select,summary,[role="button"],[contenteditable="true"]',
        ))
      );

      const removeListeners = () => {
        storyVideo.removeEventListener('loadeddata', startPlayback);
        storyVideo.removeEventListener('canplay', startPlayback);
        storyVideo.removeEventListener('ended', beginReveal);
        storyVideo.removeEventListener('error', finishWithoutMarking);
        storyVideo.removeEventListener('waiting', beginStallWatch);
        storyVideo.removeEventListener('stalled', beginStallWatch);
        storyVideo.removeEventListener('playing', resumePlaybackWatch);
        storyVideo.removeEventListener('timeupdate', trackPlaybackProgress);
        window.removeEventListener('scroll', finishOnScroll);
        window.removeEventListener('pointerdown', finishOnPointer);
        window.removeEventListener('click', finishOnClick);
        window.removeEventListener('keydown', finishOnKey);
        window.removeEventListener('pagehide', finishOnPageHide);
        document.removeEventListener('visibilitychange', finishOnVisibilityChange);
        mediaQuery.removeEventListener?.('change', finishOnLayoutChange);
      };

      const teardown = () => {
        window.clearTimeout(readinessTimer);
        window.clearTimeout(playbackTimer);
        window.clearTimeout(revealTimer);
        window.clearTimeout(stallTimer);
        removeListeners();
        storyVideo.pause();
        storyVideo.removeAttribute('src');
        storyVideo.removeAttribute('poster');
        storyVideo.load();
      };

      const finish = (markSeen: boolean) => {
        if (finished) return;
        finished = true;
        if (markSeen) markAtmosphereStorySeen();
        teardown();
        setPhase('complete');
        onActiveChange(false);
      };

      function finishWithoutMarking() {
        finish(false);
      }

      function finishOnVisibilityChange() {
        if (document.hidden) finish(true);
      }

      function finishOnScroll() {
        if (
          Math.abs(window.scrollX - initialScrollX) > 48
          || Math.abs(window.scrollY - initialScrollY) > 48
        ) finish(true);
      }

      function finishOnPointer(event: PointerEvent) {
        if (isInteractiveTarget(event.target)) finish(true);
      }

      function finishOnClick(event: MouseEvent) {
        if (isInteractiveTarget(event.target)) finish(true);
      }

      function finishOnKey(event: KeyboardEvent) {
        if (
          event.key === 'Escape'
          || ((event.key === 'Enter' || event.key === ' ') && isInteractiveTarget(event.target))
        ) finish(true);
      }

      function finishOnPageHide() {
        finish(true);
      }

      function finishOnLayoutChange() {
        // Never stretch the landscape film into a newly portrait viewport (or
        // vice versa). Fail open and allow a correctly composed replay later.
        finish(false);
      }

      function clearStallExit() {
        window.clearTimeout(stallTimer);
        stallTimer = 0;
      }

      function schedulePlaybackWatchdog() {
        if (finished || revealing || !playbackStarted) return;
        window.clearTimeout(playbackTimer);
        const remainingMediaMs = (
          Number.isFinite(storyVideo.duration) && storyVideo.duration > 0
        )
          ? Math.max(0, storyVideo.duration - storyVideo.currentTime) * 1000
          : HERO_STORY_FILM_MS;
        playbackTimer = window.setTimeout(
          () => finish(false),
          remainingMediaMs + PLAYBACK_GRACE_MS,
        );
      }

      function beginStallWatch() {
        if (finished || revealing || !playbackStarted) return;
        waitingForProgress = true;
        clearStallExit();
        // Safari does not expose Network Information. If playback begins and
        // then cannot advance, release the page instead of holding a frozen
        // graphite layer over the permanent hero on an unknown slow network.
        stallTimer = window.setTimeout(() => finish(false), STALL_BUDGET_MS);
      }

      function resumePlaybackWatch() {
        waitingForProgress = false;
        clearStallExit();
        schedulePlaybackWatchdog();
      }

      function trackPlaybackProgress() {
        if (storyVideo.currentTime <= lastMediaTime + 0.01) return;
        lastMediaTime = storyVideo.currentTime;
        schedulePlaybackWatchdog();
        if (waitingForProgress) beginStallWatch();
        else clearStallExit();
      }

      function beginReveal() {
        if (finished || revealing) return;
        revealing = true;
        window.clearTimeout(playbackTimer);
        clearStallExit();
        setPhase('revealing');
        revealTimer = window.setTimeout(() => finish(true), HERO_STORY_REVEAL_MS);
      }

      async function startPlayback() {
        if (finished || starting || revealing || storyVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          return;
        }
        starting = true;
        try {
          storyVideo.currentTime = 0;
          await storyVideo.play();
          if (finished) return;
          playbackStarted = true;
          lastMediaTime = storyVideo.currentTime;
          window.clearTimeout(readinessTimer);
          setPhase('playing');
          schedulePlaybackWatchdog();
        } catch {
          finish(false);
        }
      }

      finishRef.current = () => finish(true);
      if (document.hidden) {
        finish(false);
        return () => {
          finishRef.current = () => {};
        };
      }

      onActiveChange(true);
      storyVideo.muted = true;
      storyVideo.defaultMuted = true;
      storyVideo.playsInline = true;
      storyVideo.poster = selectedPoster;
      storyVideo.src = selectedSource;

      storyVideo.addEventListener('loadeddata', startPlayback);
      storyVideo.addEventListener('canplay', startPlayback);
      storyVideo.addEventListener('ended', beginReveal);
      storyVideo.addEventListener('error', finishWithoutMarking);
      storyVideo.addEventListener('waiting', beginStallWatch);
      storyVideo.addEventListener('stalled', beginStallWatch);
      storyVideo.addEventListener('playing', resumePlaybackWatch);
      storyVideo.addEventListener('timeupdate', trackPlaybackProgress);
      window.addEventListener('scroll', finishOnScroll, { passive: true });
      window.addEventListener('pointerdown', finishOnPointer, { passive: true });
      window.addEventListener('click', finishOnClick);
      window.addEventListener('keydown', finishOnKey);
      window.addEventListener('pagehide', finishOnPageHide, { once: true });
      document.addEventListener('visibilitychange', finishOnVisibilityChange);
      mediaQuery.addEventListener?.('change', finishOnLayoutChange);

      readinessTimer = window.setTimeout(() => finish(false), READINESS_BUDGET_MS);
      storyVideo.load();
      if (storyVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) void startPlayback();

      return () => {
        if (!finished) {
          finished = true;
          teardown();
          onActiveChange(false);
        }
        finishRef.current = () => {};
      };
    }, [film, onActiveChange]);

    if (phase === 'complete') return null;

    return (
      <div className="atmosphere-story" data-phase={phase} aria-hidden>
        <video
          ref={videoRef}
          className="atmosphere-story__film"
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          tabIndex={-1}
        />
      </div>
    );
  },
);

export default AtmosphereStory;
