export type HeroStoryMode = 'desktop' | 'mobile';

export type HeroStoryFrameIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HeroStoryState = {
  fromIndex: HeroStoryFrameIndex;
  toIndex: HeroStoryFrameIndex;
  fromOpacity: number;
  toOpacity: number;
  finalReveal: number;
};

export const HERO_STORY_TOTAL_MS: Record<HeroStoryMode, number> = {
  desktop: 9600,
  mobile: 8400,
};

type StoryTransition = {
  fromIndex: HeroStoryFrameIndex;
  toIndex: HeroStoryFrameIndex;
  startMs: number;
  endMs: number;
};

type StoryTimeline = {
  transitions: readonly StoryTransition[];
  finalRevealStartMs: number;
};

const STORY_TIMELINES: Record<HeroStoryMode, StoryTimeline> = {
  desktop: {
    transitions: [
      { fromIndex: 0, toIndex: 1, startMs: 650, endMs: 1250 },
      { fromIndex: 1, toIndex: 2, startMs: 1700, endMs: 2350 },
      { fromIndex: 2, toIndex: 3, startMs: 2800, endMs: 3500 },
      { fromIndex: 3, toIndex: 4, startMs: 3950, endMs: 4700 },
      { fromIndex: 4, toIndex: 5, startMs: 5150, endMs: 5950 },
      { fromIndex: 5, toIndex: 6, startMs: 6450, endMs: 7350 },
    ],
    finalRevealStartMs: 8000,
  },
  mobile: {
    transitions: [
      { fromIndex: 0, toIndex: 1, startMs: 500, endMs: 1000 },
      { fromIndex: 1, toIndex: 2, startMs: 1350, endMs: 1900 },
      { fromIndex: 2, toIndex: 3, startMs: 2250, endMs: 2850 },
      { fromIndex: 3, toIndex: 4, startMs: 3200, endMs: 3850 },
      { fromIndex: 4, toIndex: 5, startMs: 4200, endMs: 4900 },
      { fromIndex: 5, toIndex: 6, startMs: 5300, endMs: 6100 },
    ],
    finalRevealStartMs: 7000,
  },
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeInOutCubic(value: number): number {
  const progress = clamp01(value);

  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function clampElapsed(elapsedMs: number, totalMs: number): number {
  if (Number.isNaN(elapsedMs) || elapsedMs === Number.NEGATIVE_INFINITY) {
    return 0;
  }

  if (elapsedMs === Number.POSITIVE_INFINITY) {
    return totalMs;
  }

  return Math.min(totalMs, Math.max(0, elapsedMs));
}

function heldFrame(index: HeroStoryFrameIndex): HeroStoryState {
  return {
    fromIndex: index,
    toIndex: index,
    fromOpacity: 1,
    toOpacity: 0,
    finalReveal: 0,
  };
}

/**
 * Samples Mila's opening story at a point in time.
 *
 * The seven graphite frames crossfade into one another. During the final reveal,
 * the last graphite frame stays fully drawn; the renderer fades the story
 * wrapper by `1 - finalReveal` to expose the permanent electric art beneath it.
 * Keeping those concerns separate prevents a double fade or an iris transition.
 */
export function heroStoryState(
  elapsedMs: number,
  mode: HeroStoryMode,
): HeroStoryState {
  const totalMs = HERO_STORY_TOTAL_MS[mode];
  const timeline = STORY_TIMELINES[mode];
  const elapsed = clampElapsed(elapsedMs, totalMs);
  let heldIndex: HeroStoryFrameIndex = 0;

  for (const transition of timeline.transitions) {
    if (elapsed < transition.startMs) {
      return heldFrame(heldIndex);
    }

    if (elapsed < transition.endMs) {
      const mix = easeInOutCubic(
        (elapsed - transition.startMs) /
          (transition.endMs - transition.startMs),
      );

      return {
        fromIndex: transition.fromIndex,
        toIndex: transition.toIndex,
        fromOpacity: 1 - mix,
        toOpacity: mix,
        finalReveal: 0,
      };
    }

    heldIndex = transition.toIndex;
  }

  if (elapsed < timeline.finalRevealStartMs) {
    return heldFrame(6);
  }

  const finalReveal = easeInOutCubic(
    (elapsed - timeline.finalRevealStartMs) /
      (totalMs - timeline.finalRevealStartMs),
  );

  return {
    fromIndex: 6,
    toIndex: 6,
    fromOpacity: 1,
    toOpacity: 0,
    finalReveal,
  };
}
