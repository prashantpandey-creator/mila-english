'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { HERO_STORY_TOTAL_MS, heroStoryState, type HeroStoryMode } from '@/lib/heroStory';
import type { VisualStoryFrame } from '@/lib/visualScenes';

export const STORY_SESSION_KEY = 'mila:voice-origin-story:v3';
const FRAME_INTERVAL_MS = 1000 / 24;
const READINESS_BUDGET_MS = 3500;
const MAX_STORY_PIXEL_RATIO = 1.25;

type DecodedFrame = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

type DecodeSize = {
  width: number;
  height: number;
};

export type AtmosphereStoryHandle = {
  finish: () => void;
};

type AtmosphereStoryProps = {
  frames: readonly VisualStoryFrame[];
  onActiveChange: (active: boolean) => void;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

async function decodeFrame(
  url: string,
  signal: AbortSignal,
  decodeSize: DecodeSize,
): Promise<DecodedFrame> {
  const response = await fetch(url, { cache: 'force-cache', signal });
  if (!response.ok) throw new Error(`Story frame failed: ${response.status}`);
  const blob = await response.blob();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  if ('createImageBitmap' in window) {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(blob, {
        resizeWidth: decodeSize.width,
        resizeHeight: decodeSize.height,
        resizeQuality: 'high',
      });
    } catch (error) {
      if (signal.aborted) throw error;
      bitmap = await createImageBitmap(blob);
    }
    if (signal.aborted) {
      bitmap.close();
      throw new DOMException('Aborted', 'AbortError');
    }
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = 'async';
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Story frame could not decode'));
      image.src = objectUrl;
    });
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function drawCover(
  context: CanvasRenderingContext2D,
  frame: DecodedFrame,
  width: number,
  height: number,
  focusY: number,
  opacity: number,
  offsetX: number,
  offsetY: number,
) {
  if (opacity <= 0) return;
  const scale = Math.max(width / frame.width, height / frame.height);
  const drawnWidth = frame.width * scale;
  const drawnHeight = frame.height * scale;
  const x = (width - drawnWidth) * 0.5 + offsetX;
  const y = (height - drawnHeight) * focusY + offsetY;
  context.globalAlpha = clamp(opacity);
  context.drawImage(frame.source, x, y, drawnWidth, drawnHeight);
}

const AtmosphereStory = forwardRef<AtmosphereStoryHandle, AtmosphereStoryProps>(
  function AtmosphereStory({ frames, onActiveChange }, ref) {
    const [phase, setPhase] = useState<'loading' | 'playing' | 'complete'>('loading');
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const worldsRef = useRef<HTMLDivElement>(null);
    const dialogueRef = useRef<HTMLDivElement>(null);
    const traceRef = useRef<SVGSVGElement>(null);
    const finishRef = useRef<() => void>(() => {});

    useImperativeHandle(ref, () => ({ finish: () => finishRef.current() }), []);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(max-width: 640px)');
      const mode: HeroStoryMode = mediaQuery.matches ? 'mobile' : 'desktop';
      const controller = new AbortController();
      const decoded: Array<DecodedFrame | undefined> = Array.from(
        { length: frames.length },
        () => undefined,
      );
      const initialScrollX = window.scrollX;
      const initialScrollY = window.scrollY;
      let animationFrame = 0;
      let readinessTimer = 0;
      let completionTimer = 0;
      let finished = false;
      let lastDrawAt = -Infinity;

      const releaseDecoded = () => {
        decoded.forEach((frame, index) => {
          frame?.dispose();
          decoded[index] = undefined;
        });
      };

      const finishOnVisibilityChange = () => {
        if (document.hidden) finish(true);
      };
      const finishOnScroll = () => {
        if (
          Math.abs(window.scrollX - initialScrollX) > 48
          || Math.abs(window.scrollY - initialScrollY) > 48
        ) finish(true);
      };
      const isInteractiveTarget = (target: EventTarget | null) => (
        target instanceof Element
        && Boolean(target.closest('a,button,input,textarea,select,[role="button"],[contenteditable="true"]'))
      );
      const finishOnPointer = (event: PointerEvent) => {
        if (isInteractiveTarget(event.target)) finish(true);
      };
      const finishOnClick = (event: MouseEvent) => {
        if (isInteractiveTarget(event.target)) finish(true);
      };
      const finishOnKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') finish(true);
      };
      const finishOnPageHide = () => finish(true);
      const finishOnOrientationChange = () => finish(false);

      const removeListeners = () => {
        window.removeEventListener('scroll', finishOnScroll);
        window.removeEventListener('pointerdown', finishOnPointer);
        window.removeEventListener('click', finishOnClick);
        window.removeEventListener('keydown', finishOnKey);
        window.removeEventListener('pagehide', finishOnPageHide);
        document.removeEventListener('visibilitychange', finishOnVisibilityChange);
        mediaQuery.removeEventListener?.('change', finishOnOrientationChange);
      };

      const teardown = () => {
        controller.abort();
        window.clearTimeout(readinessTimer);
        window.clearTimeout(completionTimer);
        window.cancelAnimationFrame(animationFrame);
        removeListeners();
        releaseDecoded();
      };

      const finish = (markSeen: boolean) => {
        if (finished) return;
        finished = true;
        if (markSeen) {
          try { window.sessionStorage.setItem(STORY_SESSION_KEY, '1'); } catch { /* privacy mode */ }
        }
        teardown();
        setPhase('complete');
        onActiveChange(false);
      };

      finishRef.current = () => finish(true);
      if (document.hidden) {
        finish(false);
        return () => {
          finishRef.current = () => {};
        };
      }
      onActiveChange(true);
      window.addEventListener('scroll', finishOnScroll, { passive: true });
      window.addEventListener('pointerdown', finishOnPointer, { passive: true });
      window.addEventListener('click', finishOnClick);
      window.addEventListener('keydown', finishOnKey);
      window.addEventListener('pagehide', finishOnPageHide, { once: true });
      document.addEventListener('visibilitychange', finishOnVisibilityChange);
      mediaQuery.addEventListener?.('change', finishOnOrientationChange);

      readinessTimer = window.setTimeout(() => finish(false), READINESS_BUDGET_MS);
      const urls = frames.map((frame) => mode === 'mobile' ? frame.mobile : frame.desktop);
      const sourceWidth = mode === 'mobile' ? 864 : 1814;
      const sourceHeight = mode === 'mobile' ? 1821 : 867;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_STORY_PIXEL_RATIO);
      const coverScale = Math.min(1, Math.max(
        (window.innerWidth * pixelRatio) / sourceWidth,
        (window.innerHeight * pixelRatio) / sourceHeight,
      ));
      const decodeSize: DecodeSize = {
        width: Math.max(1, Math.round(sourceWidth * coverScale)),
        height: Math.max(1, Math.round(sourceHeight * coverScale)),
      };

      Promise.all(urls.map(async (url, index) => {
        const frame = await decodeFrame(url, controller.signal, decodeSize);
        if (finished) {
          frame.dispose();
          return;
        }
        decoded[index] = frame;
      }))
        .then(() => {
          if (finished) return;
          window.clearTimeout(readinessTimer);
          const stage = stageRef.current;
          const canvas = canvasRef.current;
          const context = canvas?.getContext('2d', { alpha: false });
          if (!stage || !canvas || !context || decoded.some((frame) => !frame)) {
            finish(false);
            return;
          }

          setPhase('playing');
          const startedAt = performance.now();
          const totalMs = HERO_STORY_TOTAL_MS[mode];
          const focusY = mode === 'mobile' ? 0.31 : 0.5;
          stage.style.clipPath = 'none';
          stage.style.opacity = '1';
          completionTimer = window.setTimeout(() => finish(true), totalMs + 1200);

          const draw = (now: number) => {
            if (finished) return;
            const rawElapsed = now - startedAt;
            const elapsed = Number.isFinite(rawElapsed)
              ? Math.min(totalMs, Math.max(0, rawElapsed))
              : 0;
            try {
              if (now - lastDrawAt >= FRAME_INTERVAL_MS || elapsed === totalMs) {
                lastDrawAt = now;
                const ratio = Math.min(window.devicePixelRatio || 1, MAX_STORY_PIXEL_RATIO);
                const rect = stage.getBoundingClientRect();
                const width = Math.max(1, Math.round(rect.width * ratio));
                const height = Math.max(1, Math.round(rect.height * ratio));
                if (canvas.width !== width || canvas.height !== height) {
                  canvas.width = width;
                  canvas.height = height;
                }

                context.globalAlpha = 1;
                context.fillStyle = '#fffafc';
                context.fillRect(0, 0, width, height);
                const story = heroStoryState(elapsed, mode);
                const offsets = [[0, 0], [.34, -.2], [-.28, .26], [.18, .16]] as const;
                const rawBoil = story.finalReveal === 0 ? Math.floor(elapsed / (1000 / 12)) : 0;
                const boil = Number.isFinite(rawBoil) ? Math.abs(rawBoil) % offsets.length : 0;
                const [boilX, boilY] = offsets[boil] ?? offsets[0];
                const fromFrame = decoded[story.fromIndex];
                const toFrame = decoded[story.toIndex];
                if (!fromFrame || !toFrame) throw new Error('Story frame unavailable');
                // Source-over needs an opaque base plus the destination mix.
                // Drawing both frames at complementary alpha would leak the
                // paper fill through and wash out every midpoint.
                const baseOpacity = clamp(story.fromOpacity + story.toOpacity);

                drawCover(
                  context,
                  fromFrame,
                  width,
                  height,
                  focusY,
                  baseOpacity,
                  boilX * ratio,
                  boilY * ratio,
                );
                if (story.toIndex !== story.fromIndex) {
                  drawCover(
                    context,
                    toFrame,
                    width,
                    height,
                    focusY,
                    story.toOpacity,
                    -boilX * ratio,
                    -boilY * ratio,
                  );
                }
                context.globalAlpha = 1;

                // The electric Mila is already registered beneath the canvas.
                // A straight fade preserves that geometry without a portal/iris.
                stage.style.opacity = String(1 - story.finalReveal);
                const trace = traceRef.current;
                const tracePath = trace?.querySelector('path');
                if (trace && tracePath) {
                  const pulse = Math.sin(Math.PI * story.finalReveal);
                  trace.style.opacity = String(clamp(pulse * 0.88));
                  tracePath.style.strokeDashoffset = String(1 - story.finalReveal);
                }

                const progress = elapsed / totalMs;

                // Quiet paper comes first. Each person then offers a short
                // line, and those strokes meet as one shared waveform.
                const dialogue = dialogueRef.current;
                const dialoguePaths = dialogue?.querySelectorAll<SVGPathElement>('path');
                if (dialogue && dialoguePaths?.length) {
                  const leftProgress = clamp((progress - .045) / .11);
                  const rightProgress = clamp((progress - .12) / .11);
                  const bridgeProgress = clamp((progress - .215) / .14);
                  const dialogueFade = 1 - clamp((progress - .43) / .12);
                  dialogue.style.opacity = String(dialogueFade * 0.62);
                  dialoguePaths.forEach((path) => {
                    const beat = path.dataset.beat;
                    const pathProgress = beat === 'left'
                      ? leftProgress
                      : beat === 'right'
                        ? rightProgress
                        : bridgeProgress;
                    path.style.strokeDashoffset = String(1 - pathProgress);
                  });
                }

                // Mila is the bridge between a loose organic world and a
                // precise geometric one. Both languages remain visible until
                // their ribbons have physically wound into the same form.
                const worlds = worldsRef.current;
                if (worlds) {
                  const collision = clamp((progress - .13) / .44);
                  const worldFade = 1 - clamp((progress - .63) / .19);
                  const nodePulse = clamp((progress - .34) / .1)
                    * (1 - clamp((progress - .72) / .1));
                  worlds.style.opacity = String(worldFade * 0.48);
                  worlds.querySelectorAll<SVGElement>('[data-world="organic"]').forEach((world) => {
                    world.style.transform = `translate3d(${collision * 5}px,0,0)`;
                  });
                  worlds.querySelectorAll<SVGElement>('[data-world="geometric"]').forEach((world) => {
                    world.style.transform = `translate3d(${-collision * 5}px,0,0)`;
                  });
                  worlds.querySelectorAll<SVGPathElement>('[data-world="seam"]').forEach((seam) => {
                    seam.style.strokeDashoffset = String(collision);
                  });
                  worlds.querySelectorAll<SVGCircleElement>('[data-world="meeting"]').forEach((node) => {
                    node.style.opacity = String(nodePulse);
                    node.setAttribute('r', String(3 + nodePulse * 3));
                  });
                }
              }
            } catch {
              finish(false);
              return;
            }

            if (elapsed >= totalMs) finish(true);
            else animationFrame = window.requestAnimationFrame(draw);
          };

          draw(performance.now());
        })
        .catch((error: unknown) => {
          if (!finished && !(error instanceof DOMException && error.name === 'AbortError')) {
            finish(false);
          }
        });

      return () => {
        if (!finished) {
          finished = true;
          teardown();
          onActiveChange(false);
        }
        finishRef.current = () => {};
      };
    }, [frames, onActiveChange]);

    if (phase === 'complete') return null;

    return (
      <>
        <div ref={stageRef} className="atmosphere-story" data-phase={phase} aria-hidden>
          <canvas ref={canvasRef} className="atmosphere-story__canvas" />
        </div>
        <div ref={worldsRef} className="atmosphere-story__worlds" aria-hidden>
          <svg className="atmosphere-story__worlds-desktop" viewBox="0 0 1814 867" preserveAspectRatio="xMidYMid slice">
            <g data-world="organic">
              <path d="M885 186 C930 115 1050 92 1145 143 C1216 181 1242 254 1224 324" />
              <path d="M864 589 C930 646 1060 674 1170 625 C1212 606 1240 577 1254 545" />
              <path d="M930 218 C972 190 1018 183 1060 194 C1014 224 986 258 977 300" />
            </g>
            <g data-world="geometric">
              <path d="M1380 152 L1618 104 L1740 224 L1680 508 L1512 646 L1362 562" />
              <path d="M1434 180 L1582 151 L1676 239 M1412 586 L1526 606 L1654 493" />
              <path d="M1490 132 L1512 646 M1584 119 L1602 550 M1386 252 L1715 330 M1370 382 L1696 446" />
            </g>
            <path data-world="seam" pathLength="1" d="M1302 104 C1277 184 1328 226 1298 302 C1270 373 1330 418 1298 493 C1270 558 1320 618 1296 704" />
            <circle data-world="meeting" cx="1298" cy="272" r="3" />
          </svg>
          <svg className="atmosphere-story__worlds-mobile" viewBox="0 0 864 1821" preserveAspectRatio="xMidYMid slice">
            <g data-world="organic">
              <path d="M68 190 C118 122 242 112 332 172 C382 206 404 262 390 328" />
              <path d="M54 642 C126 706 268 712 370 645 C404 622 422 590 426 554" />
              <path d="M108 234 C160 198 220 194 268 215 C218 242 184 282 174 330" />
            </g>
            <g data-world="geometric">
              <path d="M505 158 L708 112 L818 218 L782 552 L666 682 L510 620" />
              <path d="M550 184 L688 154 L774 238 M532 610 L646 640 L760 526" />
              <path d="M596 142 L610 660 M690 126 L700 596 M520 286 L798 342 M514 438 L786 490" />
            </g>
            <path data-world="seam" pathLength="1" d="M436 126 C408 214 460 264 430 352 C404 430 456 492 430 572 C408 638 448 694 428 760" />
            <circle data-world="meeting" cx="442" cy="326" r="3" />
          </svg>
        </div>
        <div ref={dialogueRef} className="atmosphere-story__dialogue" aria-hidden>
          <svg className="atmosphere-story__dialogue-desktop" viewBox="0 0 1814 867" preserveAspectRatio="xMidYMid slice">
            <path data-beat="left" pathLength="1" d="M1090 283 C1132 266 1168 292 1235 270" />
            <path data-beat="right" pathLength="1" d="M1460 274 C1418 257 1382 292 1320 272" />
            <path data-beat="bridge" pathLength="1" d="M1235 270 C1250 270 1255 266 1264 270 L1273 270 L1278 254 L1284 288 L1290 244 L1297 296 L1303 261 L1309 278 L1320 272" />
          </svg>
          <svg className="atmosphere-story__dialogue-mobile" viewBox="0 0 864 1821" preserveAspectRatio="xMidYMid slice">
            <path data-beat="left" pathLength="1" d="M245 338 C284 315 319 346 365 325" />
            <path data-beat="right" pathLength="1" d="M640 332 C601 310 561 348 520 326" />
            <path data-beat="bridge" pathLength="1" d="M365 325 C390 325 401 321 416 325 L426 325 L432 305 L439 351 L447 292 L455 360 L464 309 L473 342 L482 319 C493 326 505 326 520 326" />
          </svg>
        </div>
        <svg
          ref={traceRef}
          className="atmosphere-story__trace"
          viewBox="0 0 1000 240"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            pathLength="1"
            d="M0 120 L82 120 L110 111 L126 144 L145 78 L166 176 L188 120 L232 120 L250 102 L270 151 L292 52 L314 194 L337 120 L382 120 L399 91 L417 160 L438 70 L459 181 L481 120 L530 120 L548 104 L566 145 L584 82 L603 170 L624 120 L670 120 L690 96 L710 158 L730 62 L750 186 L773 120 L820 120 L842 106 L860 142 L878 88 L897 166 L918 120 L1000 120"
          />
        </svg>
      </>
    );
  },
);

export default AtmosphereStory;
