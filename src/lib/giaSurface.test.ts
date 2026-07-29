import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

test('Gia launches free-first and keeps a real text fallback', () => {
  const voicePage = readSource('src/app/darshan/page.tsx');

  assert.match(voicePage, /GIA_LIVE_FREE_LAUNCH/);
  assert.match(voicePage, /mode: "gia"/);
  assert.match(voicePage, /Start Gia Live free/);
  assert.match(voicePage, /No payment is required/);
  assert.match(voicePage, /className="voice-text-handoff"/);
  assert.match(voicePage, /href="\/pricing"/);
  assert.match(voicePage, /How free Gia Live access works/);
  assert.doesNotMatch(voicePage, /Your free Live preview is complete/);
  assert.doesNotMatch(voicePage, /Starting it uses your one free Live preview/);
  assert.doesNotMatch(voicePage, /MILA_ORIGIN/);
  assert.match(voicePage, /const canOperateVoice = isConnected \|\| canUseLiveVoice/);
  assert.doesNotMatch(voicePage, /INVITES\.length/);
});

test('Gia voice and text share the selected synthetic presence', () => {
  const voicePage = readSource('src/app/darshan/page.tsx');
  const chatPage = readSource('src/app/chat/page.tsx');

  assert.match(voicePage, /localStorage\.setItem\(PRESENCE_STORAGE_KEY, next\)/);
  assert.match(chatPage, /localStorage\.getItem\(PRESENCE_STORAGE_KEY\)/);
  assert.match(chatPage, /className="chat-page__presence-image"/);
});

test('Gia separates portrait inspection from the explicit Live action', () => {
  const voicePage = readSource('src/app/darshan/page.tsx');
  const portraitDialog = readSource('src/components/voice/PresencePortraitDialog.tsx');

  assert.match(voicePage, /portraitControlsVoice \? connectToVoice : \(\) => setShowPortrait\(true\)/);
  assert.match(voicePage, /className="voice-start-cta"/);
  assert.match(voicePage, /<PresencePortraitDialog/);
  assert.match(portraitDialog, /aria-modal="true"/);
  assert.match(portraitDialog, /event\.key === "Escape"/);
  assert.match(portraitDialog, /Start Gia Live free/);
  assert.match(portraitDialog, /Only the visual look changes/);
});

test('Gia silences background tabs and resumes only from a deliberate tap', () => {
  const voicePage = readSource('src/app/darshan/page.tsx');
  const realtimeVoice = readSource('src/lib/realtimeVoice.ts');

  assert.match(voicePage, /createGiaVoiceTabCoordinator/);
  assert.match(voicePage, /document\.addEventListener\("visibilitychange"/);
  assert.match(voicePage, /window\.addEventListener\("blur", pauseActiveVoice\)/);
  assert.match(voicePage, /!document\.hasFocus\(\)/);
  assert.match(voicePage, /await realtimeRef\.current\?\.resume\(\)/);
  assert.match(voicePage, /Tap Gia to resume your microphone and audio/);
  assert.match(realtimeVoice, /microphoneTrack\.enabled = false/);
  assert.match(realtimeVoice, /audio\.pause\(\)/);
  assert.match(realtimeVoice, /type: 'output_audio_buffer\.clear'/);
});

test('Gia deletion is host-scoped and cannot fall through to account deletion', () => {
  const accountRoute = readSource('src/app/api/users/me/route.ts');
  const giaBoundary = accountRoute.indexOf('if (isGiaHostname(host))');
  const fullAccountBoundary = accountRoute.indexOf("if (body?.scope !== 'account')");

  assert.ok(giaBoundary >= 0);
  assert.ok(fullAccountBoundary > giaBoundary);
  assert.match(accountRoute, /return NextResponse\.json\(\{ deleted: true, scope: 'gia' \}\)/);
});

test('Gia social media assets bypass product ownership redirects', () => {
  const middleware = readSource('src/middleware.ts');

  assert.match(middleware, /'\/gia-og-v2\.jpg'/);
});
