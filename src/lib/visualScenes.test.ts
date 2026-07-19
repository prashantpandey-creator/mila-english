// Run: npx tsx src/lib/visualScenes.test.ts
import assert from 'node:assert';
import {
  MILA_ATELIER,
  MILA_VOICE_ORIGIN_STORY,
  visualScenesForRoute,
} from './visualScenes';

assert.equal(MILA_ATELIER.stillDesktop, '/visuals/v6/mila-mineral-voice-desktop-v1.webp');
assert.equal(MILA_ATELIER.stillMobile, '/visuals/v6/mila-mineral-voice-mobile-v1.webp');
assert.equal(MILA_ATELIER.sketchDesktop, '/visuals/v5/mila-graphite-voice-desktop-v1.webp');
assert.equal(MILA_ATELIER.sketchMobile, '/visuals/v5/mila-graphite-voice-mobile-v1.webp');

assert.deepEqual(
  MILA_VOICE_ORIGIN_STORY.map((frame) => frame.id),
  ['quiet', 'apart', 'listen', 'weave', 'fold', 'converge', 'final'],
);
assert.equal(MILA_VOICE_ORIGIN_STORY.length, 7);

const generatedFrames = MILA_VOICE_ORIGIN_STORY.slice(0, 6);
for (const frame of generatedFrames) {
  assert.match(frame.desktop, /^\/visuals\/v6\/.*-desktop-v1\.webp$/);
  assert.match(frame.mobile, /^\/visuals\/v6\/.*-mobile-v1\.webp$/);
}

assert.deepEqual(
  generatedFrames.map((frame) => frame.desktop),
  [
    '/visuals/v6/mila-story-00-quiet-desktop-v1.webp',
    '/visuals/v6/mila-story-01-apart-desktop-v1.webp',
    '/visuals/v6/mila-story-02-listen-desktop-v1.webp',
    '/visuals/v6/mila-story-03-weave-desktop-v1.webp',
    '/visuals/v6/mila-story-04-fold-desktop-v1.webp',
    '/visuals/v6/mila-story-05-converge-desktop-v1.webp',
  ],
);

assert.deepEqual(
  generatedFrames.map((frame) => frame.mobile),
  [
    '/visuals/v6/mila-story-00-quiet-mobile-v1.webp',
    '/visuals/v6/mila-story-01-apart-mobile-v1.webp',
    '/visuals/v6/mila-story-02-listen-mobile-v1.webp',
    '/visuals/v6/mila-story-03-weave-mobile-v1.webp',
    '/visuals/v6/mila-story-04-fold-mobile-v1.webp',
    '/visuals/v6/mila-story-05-converge-mobile-v1.webp',
  ],
);

const finalFrame = MILA_VOICE_ORIGIN_STORY[6];
assert.equal(finalFrame.id, 'final');
assert.equal(finalFrame.desktop, MILA_ATELIER.sketchDesktop);
assert.equal(finalFrame.mobile, MILA_ATELIER.sketchMobile);
assert.match(finalFrame.desktop, /^\/visuals\/v5\//);
assert.match(finalFrame.mobile, /^\/visuals\/v5\//);

assert.equal(new Set(MILA_VOICE_ORIGIN_STORY.map((frame) => frame.id)).size, 7);
assert.equal(new Set(MILA_VOICE_ORIGIN_STORY.map((frame) => frame.desktop)).size, 7);
assert.equal(new Set(MILA_VOICE_ORIGIN_STORY.map((frame) => frame.mobile)).size, 7);

const frontDoor = visualScenesForRoute('/');
assert.equal(frontDoor.length, 1);
assert.equal(frontDoor[0], MILA_ATELIER);
assert.ok(frontDoor[0].stillDesktop && frontDoor[0].sketchDesktop);
assert.ok(frontDoor[0].stillMobile && frontDoor[0].sketchMobile);

for (const route of ['/dashboard', '/listen', '/assessment', '/darshan', '/start']) {
  assert.deepEqual(visualScenesForRoute(route), [], `${route} must not load hero media`);
}

console.log('visual scenes: route-safe mineral hero and seven-frame origin story');
