// Run: npx tsx src/lib/heroStory.test.ts
import assert from 'node:assert';
import {
  HERO_STORY_TOTAL_MS,
  heroStoryState,
  type HeroStoryFrameIndex,
  type HeroStoryMode,
  type HeroStoryState,
} from './heroStory';

const EPSILON = 1e-10;

function approximately(actual: number, expected: number, message: string): void {
  assert.ok(
    Math.abs(actual - expected) <= EPSILON,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

function assertHold(
  state: HeroStoryState,
  index: HeroStoryFrameIndex,
  message: string,
): void {
  assert.equal(state.fromIndex, index, `${message}: from frame`);
  assert.equal(state.toIndex, index, `${message}: to frame`);
  assert.equal(state.fromOpacity, 1, `${message}: from opacity`);
  assert.equal(state.toOpacity, 0, `${message}: to opacity`);
  assert.equal(state.finalReveal, 0, `${message}: final reveal`);
}

function assertMidTransition(
  mode: HeroStoryMode,
  elapsedMs: number,
  fromIndex: HeroStoryFrameIndex,
  toIndex: HeroStoryFrameIndex,
): void {
  const state = heroStoryState(elapsedMs, mode);

  assert.equal(state.fromIndex, fromIndex, `${mode}: transition source`);
  assert.equal(state.toIndex, toIndex, `${mode}: transition destination`);
  approximately(state.fromOpacity, 0.5, `${mode}: source midpoint opacity`);
  approximately(state.toOpacity, 0.5, `${mode}: destination midpoint opacity`);
  assert.equal(state.finalReveal, 0, `${mode}: reveal waits for graphite`);
}

assert.deepEqual(HERO_STORY_TOTAL_MS, { desktop: 9600, mobile: 8400 });

const desktopHolds: Array<[number, HeroStoryFrameIndex, string]> = [
  [0, 0, 'start'],
  [300, 0, 'quiet'],
  [1450, 1, 'apart'],
  [2550, 2, 'listen'],
  [3700, 3, 'weave'],
  [4900, 4, 'fold'],
  [6200, 5, 'converge'],
  [7650, 6, 'final graphite'],
];

const desktopTransitions: Array<[
  number,
  HeroStoryFrameIndex,
  HeroStoryFrameIndex,
]> = [
  [950, 0, 1],
  [2025, 1, 2],
  [3150, 2, 3],
  [4325, 3, 4],
  [5550, 4, 5],
  [6900, 5, 6],
];

for (const [elapsedMs, index, label] of desktopHolds) {
  assertHold(heroStoryState(elapsedMs, 'desktop'), index, `desktop ${label} hold`);
}

for (const [elapsedMs, fromIndex, toIndex] of desktopTransitions) {
  assertMidTransition('desktop', elapsedMs, fromIndex, toIndex);
}

const mobileHolds: Array<[number, HeroStoryFrameIndex, string]> = [
  [0, 0, 'start'],
  [250, 0, 'quiet'],
  [1150, 1, 'apart'],
  [2050, 2, 'listen'],
  [3000, 3, 'weave'],
  [4000, 4, 'fold'],
  [5100, 5, 'converge'],
  [6500, 6, 'final graphite'],
];

const mobileTransitions: Array<[
  number,
  HeroStoryFrameIndex,
  HeroStoryFrameIndex,
]> = [
  [750, 0, 1],
  [1625, 1, 2],
  [2550, 2, 3],
  [3525, 3, 4],
  [4550, 4, 5],
  [5700, 5, 6],
];

for (const [elapsedMs, index, label] of mobileHolds) {
  assertHold(heroStoryState(elapsedMs, 'mobile'), index, `mobile ${label} hold`);
}

for (const [elapsedMs, fromIndex, toIndex] of mobileTransitions) {
  assertMidTransition('mobile', elapsedMs, fromIndex, toIndex);
}

const desktopReveal = heroStoryState(8800, 'desktop');
assert.equal(desktopReveal.fromIndex, 6);
assert.equal(desktopReveal.toIndex, 6);
approximately(desktopReveal.finalReveal, 0.5, 'desktop reveal midpoint');
assert.equal(desktopReveal.fromOpacity, 1, 'desktop final bitmap stays fully drawn');
assert.equal(desktopReveal.toOpacity, 0);

const mobileReveal = heroStoryState(7700, 'mobile');
assert.equal(mobileReveal.fromIndex, 6);
assert.equal(mobileReveal.toIndex, 6);
approximately(mobileReveal.finalReveal, 0.5, 'mobile reveal midpoint');
assert.equal(mobileReveal.fromOpacity, 1, 'mobile final bitmap stays fully drawn');
assert.equal(mobileReveal.toOpacity, 0);

// A quarter-step proves these are eased dissolves, not linear opacity ramps.
const easedQuarter = heroStoryState(800, 'desktop');
approximately(easedQuarter.fromOpacity, 0.9375, 'desktop eased source quarter');
approximately(easedQuarter.toOpacity, 0.0625, 'desktop eased destination quarter');

const boundaries: Record<HeroStoryMode, readonly number[]> = {
  desktop: [650, 1250, 1700, 2350, 2800, 3500, 3950, 4700, 5150, 5950, 6450, 7350, 8000],
  mobile: [500, 1000, 1350, 1900, 2250, 2850, 3200, 3850, 4200, 4900, 5300, 6100, 7000],
};

for (const mode of ['desktop', 'mobile'] as const) {
  const totalMs = HERO_STORY_TOTAL_MS[mode];
  const end = heroStoryState(totalMs, mode);
  const afterEnd = heroStoryState(totalMs + 10_000, mode);

  assert.deepEqual(afterEnd, end, `${mode}: time clamps after the end`);
  assert.equal(end.fromIndex, 6, `${mode}: final graphite source`);
  assert.equal(end.toIndex, 6, `${mode}: final graphite destination`);
  assert.equal(end.fromOpacity, 1, `${mode}: final bitmap remains fully drawn`);
  assert.equal(end.toOpacity, 0, `${mode}: no second graphite frame remains`);
  assert.equal(end.finalReveal, 1, `${mode}: electric art is fully revealed`);

  for (const elapsedMs of boundaries[mode]) {
    const state = heroStoryState(elapsedMs, mode);
    approximately(
      state.fromOpacity + state.toOpacity,
      1,
      `${mode}: complete graphite blend at boundary ${elapsedMs}`,
    );
  }

  let previousReveal = -1;
  for (let elapsedMs = 0; elapsedMs <= totalMs; elapsedMs += 25) {
    const state = heroStoryState(elapsedMs, mode);

    assert.ok(state.fromIndex >= 0 && state.fromIndex <= 6);
    assert.ok(state.toIndex >= 0 && state.toIndex <= 6);
    assert.ok(state.toIndex >= state.fromIndex);
    assert.ok(state.fromOpacity >= 0 && state.fromOpacity <= 1);
    assert.ok(state.toOpacity >= 0 && state.toOpacity <= 1);
    assert.ok(state.finalReveal >= 0 && state.finalReveal <= 1);
    assert.ok(
      state.finalReveal + EPSILON >= previousReveal,
      `${mode}: final reveal must be monotonic at ${elapsedMs}ms`,
    );

    approximately(
      state.fromOpacity + state.toOpacity,
      1,
      `${mode}: graphite opacity blend at ${elapsedMs}ms`,
    );
    approximately(
      (state.fromOpacity + state.toOpacity) * (1 - state.finalReveal) +
        state.finalReveal,
      1,
      `${mode}: wrapper fade and electric reveal at ${elapsedMs}ms`,
    );

    previousReveal = state.finalReveal;
  }
}

assertHold(heroStoryState(-100, 'desktop'), 0, 'negative time');
assertHold(heroStoryState(Number.NEGATIVE_INFINITY, 'mobile'), 0, '-Infinity');
assertHold(heroStoryState(Number.NaN, 'desktop'), 0, 'NaN');
assert.deepEqual(
  heroStoryState(Number.POSITIVE_INFINITY, 'mobile'),
  heroStoryState(HERO_STORY_TOTAL_MS.mobile, 'mobile'),
  '+Infinity clamps to the end',
);

console.log('hero story: seven desktop and mobile stages are smooth and bounded');
