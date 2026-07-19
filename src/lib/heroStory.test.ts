// Run: npx tsx src/lib/heroStory.test.ts
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  HERO_STORY_DRAWING_COUNT,
  HERO_STORY_DRAWING_COUNTS,
  HERO_STORY_DRAWING_HOLDS,
  HERO_STORY_EXPOSURE_COUNT,
  HERO_STORY_EXPOSURE_COUNTS,
  HERO_STORY_FILM_MS,
  HERO_STORY_FPS,
  HERO_STORY_KEYFRAME_NAMES,
  HERO_STORY_REVEAL_MS,
  HERO_STORY_TOTAL_MS,
  heroStoryDrawingAtExposure,
} from './heroStory';

assert.equal(HERO_STORY_FPS, 12);
assert.equal(HERO_STORY_KEYFRAME_NAMES.length, 12);
assert.deepEqual(
  HERO_STORY_KEYFRAME_NAMES,
  [
    'quiet',
    'apart',
    'listen',
    'bridge',
    'weave',
    'midcurl',
    'fold',
    'tighten',
    'converge',
    'land',
    'nearfinal',
    'final',
  ],
);
assert.equal(HERO_STORY_DRAWING_COUNT, 53);
assert.deepEqual(HERO_STORY_DRAWING_COUNTS, { desktop: 53, mobile: 51 });
assert.equal(HERO_STORY_EXPOSURE_COUNT, 141);
assert.deepEqual(HERO_STORY_EXPOSURE_COUNTS, { desktop: 141, mobile: 141 });
assert.equal(HERO_STORY_FILM_MS, 11750);
assert.equal(HERO_STORY_REVEAL_MS, 600);
assert.equal(HERO_STORY_TOTAL_MS, 12350);

const renderer = readFileSync(
  new URL('../../scripts/render-mila-story-film.sh', import.meta.url),
  'utf8',
);
function rendererHolds(name: 'DESKTOP' | 'MOBILE'): number[] | undefined {
  return renderer
    .match(new RegExp(`HOLDS_${name}=\\(([^)]+)\\)`))?.[1]
    .trim()
    .split(/\s+/)
    .map(Number);
}

assert.deepEqual(rendererHolds('DESKTOP'), [...HERO_STORY_DRAWING_HOLDS.desktop]);
assert.deepEqual(rendererHolds('MOBILE'), [...HERO_STORY_DRAWING_HOLDS.mobile]);
assert.match(renderer, /expected_drawings=53/);
assert.match(renderer, /expected_drawings=51/);
assert.match(renderer, /frame != 141/);

for (const mode of ['desktop', 'mobile'] as const) {
  const holds = HERO_STORY_DRAWING_HOLDS[mode];
  let start = 0;
  for (let index = 0; index < holds.length; index += 1) {
    const hold = holds[index];
    assert.equal(
      heroStoryDrawingAtExposure(start, mode),
      index,
      `${mode} drawing ${index} starts correctly`,
    );
    assert.equal(
      heroStoryDrawingAtExposure(start + hold - 1, mode),
      index,
      `${mode} drawing ${index} holds through its final exposure`,
    );
    start += hold;
  }
  assert.equal(start, HERO_STORY_EXPOSURE_COUNTS[mode]);
  assert.equal(heroStoryDrawingAtExposure(HERO_STORY_EXPOSURE_COUNTS[mode], mode), holds.length - 1);
  assert.equal(heroStoryDrawingAtExposure(Number.POSITIVE_INFINITY, mode), holds.length - 1);
}

assert.equal(heroStoryDrawingAtExposure(-100), 0);
assert.equal(heroStoryDrawingAtExposure(Number.NaN), 0);
assert.equal(heroStoryDrawingAtExposure(Number.NEGATIVE_INFINITY), 0);

console.log('hero story: 53/51 drawings, 141 stepped exposures, 11.75-second film');
