import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import {
  MIA_SCENE_MEDIA,
  buildFallbackMiaScene,
  miaSceneRequestSchema,
  miaSceneResponseSchema,
} from './miaScenes';

test('Mia scene requests accept bounded travel choices and reject unsafe shapes', () => {
  assert.equal(miaSceneRequestSchema.safeParse({
    destination: 'Lisbon',
    situation: 'cafe',
    level: 'first-words',
    uiLanguage: 'en',
  }).success, true);
  assert.equal(miaSceneRequestSchema.safeParse({
    destination: '',
    situation: 'anything',
    level: 'expert',
  }).success, false);
});

test('the curated fallback is useful, product-neutral, and schema-valid', () => {
  const scene = buildFallbackMiaScene({
    destination: 'Lisbon',
    situation: 'cafe',
    level: 'first-words',
    uiLanguage: 'en',
  });
  assert.equal(scene.destination, 'Lisbon');
  assert.equal(scene.language, 'Portuguese');
  assert.match(scene.phrase, /café/i);
  assert.ok(scene.translation.length > 10);
  assert.ok(scene.cultureNote.length > 20);
  assert.doesNotMatch(JSON.stringify(scene), /\b(?:Gia|Mila)\b/);
  assert.equal(miaSceneResponseSchema.safeParse(scene).success, true);
});

test('unsupported destinations use an honest localized bridge instead of inventing a local language', () => {
  const scene = buildFallbackMiaScene({
    destination: 'Bangkok',
    situation: 'directions',
    level: 'first-words',
    uiLanguage: 'ru',
  });
  assert.match(scene.language, /запасная сцена/i);
  assert.match(scene.setting, /Ты в городе Bangkok/);
  assert.match(scene.cultureNote, /не будет выдумывать местный язык/i);
  assert.equal(scene.speechLocale, 'en');
});

test('every Mia cinematic scene has a committed poster and video', () => {
  for (const media of Object.values(MIA_SCENE_MEDIA)) {
    assert.equal(existsSync(`public${media.poster}`), true, media.poster);
    assert.equal(existsSync(`public${media.video}`), true, media.video);
  }
});
