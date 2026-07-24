import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

test('Gia discovers an unused Live preview and keeps a real text fallback', () => {
  const voicePage = readSource('src/app/darshan/page.tsx');

  assert.match(voicePage, /if \(!paid && available\) setFreePreview\(true\)/);
  assert.match(voicePage, /className="voice-text-handoff"/);
  assert.match(voicePage, /Starting it uses your one free Live preview/);
  assert.match(voicePage, /href=\{`\$\{MILA_ORIGIN\}\/pricing`\}/);
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
