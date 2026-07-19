// Run: npx tsx src/lib/visualScenes.test.ts
import assert from 'node:assert';
import { MILA_ATELIER, visualScenesForRoute } from './visualScenes';

assert.equal(MILA_ATELIER.stillDesktop, '/visuals/v6/mila-mineral-voice-desktop-v1.webp');
assert.equal(MILA_ATELIER.stillMobile, '/visuals/v6/mila-mineral-voice-mobile-v1.webp');
assert.equal(MILA_ATELIER.sketchDesktop, '/visuals/v5/mila-graphite-voice-desktop-v1.webp');
assert.equal(MILA_ATELIER.sketchMobile, '/visuals/v5/mila-graphite-voice-mobile-v1.webp');

const frontDoor = visualScenesForRoute('/');
assert.equal(frontDoor.length, 1);
assert.equal(frontDoor[0], MILA_ATELIER);
assert.ok(frontDoor[0].stillDesktop && frontDoor[0].sketchDesktop);
assert.ok(frontDoor[0].stillMobile && frontDoor[0].sketchMobile);

for (const route of ['/dashboard', '/listen', '/assessment', '/darshan', '/start']) {
  assert.deepEqual(visualScenesForRoute(route), [], `${route} must not load hero media`);
}

console.log('visual scenes: mineral and graphite pairs are route-safe');
