import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const nextConfig = readFileSync('next.config.mjs', 'utf8');
const middleware = readFileSync('src/middleware.ts', 'utf8');
const miaPage = readFileSync('src/app/mia/page.tsx', 'utf8');
const miaMetadata = readFileSync('src/app/mia/layout.tsx', 'utf8');
const routeSurface = readFileSync('src/components/RouteSurface.tsx', 'utf8');
const bottomNav = readFileSync('src/components/BottomNav.tsx', 'utf8');
const milaHome = readFileSync('src/app/MilaHomePageClient.tsx', 'utf8');
const privacy = readFileSync('src/app/privacy/page.tsx', 'utf8');
const terms = readFileSync('src/app/terms/page.tsx', 'utf8');

test('Gia remains the gated companion while Mia owns the public traveler apex', () => {
  assert.match(nextConfig, /return \{\s*beforeFiles:/);
  assert.match(nextConfig, /value: GIA_HOST \}\],\s*destination: '\/darshan'/);
  assert.match(nextConfig, /value: MIA_HOST \}\],\s*destination: '\/mia'/);
  assert.match(middleware, /const giaApex = isGiaHostname/);
  assert.match(nextConfig, /source: '\/chat',\s*has: \[\{ type: 'host', value: MIA_HOST \}\],\s*destination: `https:\/\/\$\{GIA_HOST\}\/chat`/);
  assert.match(nextConfig, /source: '\/darshan',\s*has: \[\{ type: 'host', value: MIA_HOST \}\],\s*destination: `https:\/\/\$\{GIA_HOST\}\//);
});

test('Mia presents travel and culture without absorbing Gia or Mila', () => {
  assert.match(miaMetadata, /https:\/\/mia\.purangpt\.com/);
  assert.match(miaMetadata, /Mia — Meet the world in its own words/);
  assert.match(miaMetadata, /\/mia-og\.png/);
  assert.match(miaPage, /Mia helps you prepare for the journey/);
  assert.match(miaPage, /MEET GIA — THE COMPANION INSIDE MIA/);
  assert.match(miaPage, /https:\/\/gia\.purangpt\.com\/chat/);
  assert.match(miaPage, /https:\/\/mila\.purangpt\.com\/start/);
  assert.doesNotMatch(miaPage, /aria-label="Gia home"/);
});

test('Mia uses the marketing shell without Mila app navigation', () => {
  assert.match(routeSurface, /pathname === '\/mia'/);
  assert.match(bottomNav, /'\/mia'/);
});

test('Mila names Gia at companion handoffs and Mia is covered by shared policies', () => {
  assert.match(milaHome, /Talk with Gia/);
  assert.match(milaHome, /https:\/\/gia\.purangpt\.com\//);
  assert.match(privacy, /mila\.purangpt\.com/);
  assert.match(privacy, /gia\.purangpt\.com/);
  assert.match(privacy, /mia\.purangpt\.com/);
  assert.match(terms, /Mila, Gia, and Mia/);
});
