import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const nextConfig = readFileSync('next.config.mjs', 'utf8');
const middleware = readFileSync('src/middleware.ts', 'utf8');
const miaPage = readFileSync('src/app/mia/page.tsx', 'utf8');
const miaMetadata = readFileSync('src/app/mia/layout.tsx', 'utf8');
const sceneStudio = readFileSync('src/components/mia/MiaSceneGenerator.tsx', 'utf8');
const rootLayout = readFileSync('src/app/layout.tsx', 'utf8');
const milaHome = readFileSync('src/app/MilaHomePageClient.tsx', 'utf8');
const privacy = readFileSync('src/app/privacy/page.tsx', 'utf8');
const terms = readFileSync('src/app/terms/page.tsx', 'utf8');
const companionStore = readFileSync('src/lib/companionStore.ts', 'utf8');
const prismaSchema = readFileSync('prisma/schema.prisma', 'utf8');
const giaTheme = readFileSync('src/app/gia-theme.css', 'utf8');
const accountPage = readFileSync('src/app/account/page.tsx', 'utf8');

test('Gia remains gated while Mia owns the public traveler apex', () => {
  assert.match(nextConfig, /return \{\s*beforeFiles:/);
  assert.match(nextConfig, /value: GIA_HOST \}\],\s*destination: '\/darshan'/);
  assert.match(nextConfig, /value: MIA_HOST \}\],\s*destination: '\/mia'/);
  assert.match(middleware, /const giaApex = isGiaHostname/);
  assert.match(middleware, /if \(isMiaHostname\(host\)\)/);
  assert.match(middleware, /if \(isGiaHostname\(host\)\)/);
  assert.match(middleware, /if \(isMilaHostname\(host\) && matchesPrefix\(pathname, MILA_FOREIGN_PREFIXES\)\)/);
  assert.doesNotMatch(nextConfig, /destination: `https:\/\/\$\{GIA_HOST\}\/login/);
  assert.doesNotMatch(nextConfig, /destination: `https:\/\/\$\{MILA_HOST\}\$\{source\}`/);
});

test('Mia is an owned travel product with an interactive scene studio', () => {
  assert.match(miaMetadata, /https:\/\/mia\.purangpt\.com/);
  assert.match(miaMetadata, /Mia — Meet the world in its own words/);
  assert.match(miaMetadata, /\/mia-og\.png/);
  assert.match(miaPage, /Generate a travel scene/);
  assert.match(miaPage, /MiaSceneGenerator/);
  assert.match(miaPage, /src="\/mia-og\.png"/);
  assert.match(sceneStudio, /\/api\/mia\/scene/);
  assert.doesNotMatch(miaPage, /\bGia\b/);
  assert.doesNotMatch(miaPage, /\bMila\b/);
  assert.doesNotMatch(miaPage, /https:\/\/(?:gia|mila)\.purangpt\.com/);
});

test('Mia and Gia never mount Mila global chrome', () => {
  assert.match(rootLayout, /const showMilaChrome = product === 'mila'/);
  assert.match(rootLayout, /\{showMilaChrome \? <Atmosphere \/> : null\}/);
  assert.match(rootLayout, /\{showMilaChrome \? <MilaGuide \/> : null\}/);
  assert.match(rootLayout, /\{showMilaChrome \? <BottomNav \/> : null\}/);
});

test('Mila owns its learning entry points and shared policies cover every product', () => {
  assert.match(milaHome, /Start learning/);
  assert.match(milaHome, /\/dashboard/);
  assert.doesNotMatch(milaHome, /\bGia\b/);
  assert.doesNotMatch(milaHome, /https:\/\/gia\.purangpt\.com/);
  assert.match(privacy, /mila\.purangpt\.com/);
  assert.match(privacy, /gia\.purangpt\.com/);
  assert.match(privacy, /mia\.purangpt\.com/);
  assert.match(terms, /Mila, Gia, and Mia/);
});

test('Gia and Mila use separate durable conversation and memory namespaces', () => {
  assert.match(companionStore, /const GIA_THREAD_KEY = 'gia'/);
  assert.match(companionStore, /threadKey\(product\)/);
  assert.match(companionStore, /where: \{ userId, product \}/);
  assert.match(prismaSchema, /product\s+String\s+@default\("mila"\)/);
});

test('Gia owns a distinct visual system and account controls', () => {
  assert.match(giaTheme, /\.product-surface--gia/);
  assert.match(giaTheme, /#05080d/);
  assert.match(giaTheme, /\.product-surface--gia \.chat-page/);
  assert.match(giaTheme, /\.product-surface--gia \.welcome-auth/);
  assert.match(accountPage, /Delete Gia conversation data/);
  assert.match(middleware, /const GIA_OWNED_PREFIXES = \[\s*'\/account'/);
});
