// Run: npx tsx src/lib/visualScenes.test.ts
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  MILA_ATELIER,
  MILA_VOICE_ORIGIN_FILM,
  visualScenesForRoute,
} from './visualScenes';

assert.equal(MILA_ATELIER.stillDesktop, '/visuals/v6/mila-mineral-voice-desktop-v1.webp');
assert.equal(MILA_ATELIER.stillMobile, '/visuals/v6/mila-mineral-voice-mobile-v1.webp');
assert.equal(MILA_ATELIER.sketchDesktop, '/visuals/v5/mila-graphite-voice-desktop-v1.webp');
assert.equal(MILA_ATELIER.sketchMobile, '/visuals/v5/mila-graphite-voice-mobile-v1.webp');

assert.equal(
  MILA_VOICE_ORIGIN_FILM.desktop,
  '/visuals/v7/mila-origin-film-desktop-v1.mp4',
);
assert.equal(
  MILA_VOICE_ORIGIN_FILM.mobile,
  '/visuals/v7/mila-origin-film-mobile-v1.mp4',
);
assert.equal(
  MILA_VOICE_ORIGIN_FILM.posterDesktop,
  '/visuals/v7/mila-origin-poster-desktop-v1.webp',
);
assert.equal(
  MILA_VOICE_ORIGIN_FILM.posterMobile,
  '/visuals/v7/mila-origin-poster-mobile-v1.webp',
);

assert.match(MILA_VOICE_ORIGIN_FILM.desktop, /^\/visuals\/v7\/.*-desktop-v1\.mp4$/);
assert.match(MILA_VOICE_ORIGIN_FILM.mobile, /^\/visuals\/v7\/.*-mobile-v1\.mp4$/);
assert.match(MILA_VOICE_ORIGIN_FILM.posterDesktop, /^\/visuals\/v7\/.*-desktop-v1\.webp$/);
assert.match(MILA_VOICE_ORIGIN_FILM.posterMobile, /^\/visuals\/v7\/.*-mobile-v1\.webp$/);

for (const source of Object.values(MILA_VOICE_ORIGIN_FILM)) {
  const runtimePath = resolve('public', source.slice(1));
  assert.ok(existsSync(runtimePath), `${source} must exist in the production public tree`);
  assert.ok(statSync(runtimePath).size > 100_000, `${source} must not be an empty placeholder`);
}

function assertFilm(source: string, width: number, height: number): void {
  const runtimePath = resolve('public', source.slice(1));
  const verified = JSON.parse(execFileSync(
    process.execPath,
    [
      resolve('scripts/verify-mila-story-film.mjs'),
      runtimePath,
      source,
      String(width),
      String(height),
      '141',
      '11.75',
    ],
    { encoding: 'utf8' },
  )) as { frames: number; duration: number };
  assert.equal(verified.frames, 141);
  assert.equal(verified.duration, 11.75);
}

assertFilm(MILA_VOICE_ORIGIN_FILM.desktop, 2048, 978);
assertFilm(MILA_VOICE_ORIGIN_FILM.mobile, 960, 2024);

assert.deepEqual(readdirSync(resolve('public/visuals/v7')).sort(), [
  'mila-origin-film-desktop-v1.mp4',
  'mila-origin-film-mobile-v1.mp4',
  'mila-origin-poster-desktop-v1.webp',
  'mila-origin-poster-mobile-v1.webp',
]);
assert.equal(readdirSync(resolve('artwork/mila-story/v7/keyframes')).length, 24);
assert.equal(readdirSync(resolve('artwork/mila-story/v7/inbetweens')).length, 82);
assert.deepEqual(
  readFileSync(resolve('public/visuals/v7/mila-origin-poster-desktop-v1.webp')),
  readFileSync(resolve('artwork/mila-story/v7/keyframes/mila-film-00-quiet-desktop-v1.webp')),
);
assert.deepEqual(
  readFileSync(resolve('public/visuals/v7/mila-origin-poster-mobile-v1.webp')),
  readFileSync(resolve('artwork/mila-story/v7/keyframes/mila-film-00-quiet-mobile-v1.webp')),
);
assert.deepEqual(
  readFileSync(resolve('artwork/mila-story/v7/keyframes/mila-film-11-final-desktop-v1.webp')),
  readFileSync(resolve('public/visuals/v5/mila-graphite-voice-desktop-v1.webp')),
);
assert.deepEqual(
  readFileSync(resolve('artwork/mila-story/v7/keyframes/mila-film-11-final-mobile-v1.webp')),
  readFileSync(resolve('public/visuals/v5/mila-graphite-voice-mobile-v1.webp')),
);

const frontDoor = visualScenesForRoute('/');
assert.equal(frontDoor.length, 1);
assert.equal(frontDoor[0], MILA_ATELIER);
assert.ok(frontDoor[0].stillDesktop && frontDoor[0].sketchDesktop);
assert.ok(frontDoor[0].stillMobile && frontDoor[0].sketchMobile);

for (const route of ['/dashboard', '/listen', '/assessment', '/darshan', '/start']) {
  assert.deepEqual(visualScenesForRoute(route), [], `${route} must not load hero media`);
}

console.log('visual scenes: route-safe mineral hero and responsive v7 origin film');
