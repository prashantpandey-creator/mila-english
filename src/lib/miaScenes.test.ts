import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import {
  MIA_SCENE_MEDIA,
  buildFallbackMiaScene,
  completeGeneratedMiaScene,
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

test('generated scenes recover omitted presentation fields without losing authored content', () => {
  const fallback = buildFallbackMiaScene({
    destination: 'Tokyo',
    situation: 'directions',
    level: 'first-words',
    uiLanguage: 'en',
  });
  const scene = completeGeneratedMiaScene({
    destination: 'Tokyo',
    language: 'ja',
    title: 'Follow the lanterns to the last train',
    setting: 'A station entrance glows across a narrow Tokyo side street.',
    phrase: 'すみません、駅はどちらですか？',
    pronunciation: 'sumimasen, eki wa dochira desu ka?',
    translation: 'Excuse me, which way is the station?',
    reply: 'まっすぐ行って、左です。',
    replyPronunciation: 'massugu itte, hidari desu',
    replyTranslation: 'Go straight, then it is on the left.',
    cultureNote: 'Start with sumimasen to get someone’s attention politely.',
    mission: 'Ask once, then listen for the direction word.',
  }, fallback);

  assert.equal(scene.title, 'Follow the lanterns to the last train');
  assert.equal(scene.language, 'Japanese');
  assert.equal(scene.speechLocale, 'ja-JP');
  assert.equal(scene.visual, 'city-night');
  assert.equal(miaSceneResponseSchema.safeParse(scene).success, true);
});

test('every Mia cinematic scene has a committed poster and video', () => {
  for (const media of Object.values(MIA_SCENE_MEDIA)) {
    assert.equal(existsSync(`public${media.poster}`), true, media.poster);
    assert.equal(existsSync(`public${media.video}`), true, media.video);
  }
});
