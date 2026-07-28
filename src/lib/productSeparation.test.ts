import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const nextConfig = readFileSync('next.config.mjs', 'utf8');
const middleware = readFileSync('src/middleware.ts', 'utf8');
const giaPage = readFileSync('src/app/gia/page.tsx', 'utf8');
const giaHomeTheme = readFileSync('src/app/gia/gia-home.css', 'utf8');
const giaChat = readFileSync('src/app/chat/page.tsx', 'utf8');
const miaPage = readFileSync('src/app/mia/page.tsx', 'utf8');
const miaMetadata = readFileSync('src/app/mia/layout.tsx', 'utf8');
const sceneStudio = readFileSync('src/components/mia/MiaSceneGenerator.tsx', 'utf8');
const miaSceneRoute = readFileSync('src/app/api/mia/scene/route.ts', 'utf8');
const rootLayout = readFileSync('src/app/layout.tsx', 'utf8');
const milaHome = readFileSync('src/app/MilaHomePageClient.tsx', 'utf8');
const milaDashboard = readFileSync('src/app/dashboard/page.tsx', 'utf8');
const milaLogin = readFileSync('src/app/login/page.tsx', 'utf8');
const milaStart = readFileSync('src/app/start/page.tsx', 'utf8');
const milaGuide = readFileSync('src/components/MilaGuide.tsx', 'utf8');
const loginRoute = readFileSync('src/app/api/auth/login/route.ts', 'utf8');
const guestRoute = readFileSync('src/app/api/auth/guest/route.ts', 'utf8');
const milaBrand = readFileSync('src/lib/milaBrand.ts', 'utf8');
const privacy = readFileSync('src/app/privacy/page.tsx', 'utf8');
const terms = readFileSync('src/app/terms/page.tsx', 'utf8');
const companionStore = readFileSync('src/lib/companionStore.ts', 'utf8');
const prismaSchema = readFileSync('prisma/schema.prisma', 'utf8');
const giaTheme = readFileSync('src/app/gia-theme.css', 'utf8');
const accountPage = readFileSync('src/app/account/page.tsx', 'utf8');
const pricingPage = readFileSync('src/app/pricing/page.tsx', 'utf8');
const billingReturn = readFileSync('src/app/billing/return/page.tsx', 'utf8');

test('Gia owns a public introduction while Live and text remain gated', () => {
  assert.match(nextConfig, /return \{\s*beforeFiles:/);
  assert.match(nextConfig, /source: '\/',\s*has: \[\{ type: 'host', value: GIA_HOST \}\],\s*destination: '\/gia'/);
  assert.match(nextConfig, /source: '\/live',\s*has: \[\{ type: 'host', value: GIA_HOST \}\],\s*destination: '\/darshan'/);
  assert.match(nextConfig, /value: MIA_HOST \}\],\s*destination: '\/mia'/);
  assert.match(middleware, /'\/live'/);
  assert.doesNotMatch(middleware, /const giaApex = isGiaHostname/);
  assert.match(middleware, /if \(isMiaHostname\(host\)\)/);
  assert.match(middleware, /if \(isGiaHostname\(host\)\)/);
  assert.match(middleware, /if \(isMilaHostname\(host\) && matchesPrefix\(pathname, MILA_FOREIGN_PREFIXES\)\)/);
  assert.doesNotMatch(nextConfig, /destination: `https:\/\/\$\{GIA_HOST\}\/login/);
  assert.doesNotMatch(nextConfig, /destination: `https:\/\/\$\{MILA_HOST\}\$\{source\}`/);
});

test('Gia introduces voice and text as clear, honest companion modes', () => {
  assert.match(giaPage, /Meet Gia\./);
  assert.match(giaPage, /AI companion · voice \+ text/);
  assert.match(giaPage, /href="\/live"/);
  assert.match(giaPage, /href="\/chat"/);
  assert.match(giaPage, /Fictional AI presence/);
  assert.match(giaPage, /Voice starts only when you choose it/);
  assert.match(giaHomeTheme, /@media \(max-width: 520px\)/);
  assert.match(giaHomeTheme, /prefers-reduced-motion: reduce/);
  assert.match(giaChat, /router\.push\('\/live'\)/);
});

test('Mia is an owned travel product with an interactive scene studio', () => {
  assert.match(miaMetadata, /https:\/\/mia\.purangpt\.com/);
  assert.match(miaMetadata, /Mia — Feel the place\. Speak its language\./);
  assert.match(miaMetadata, /\/mia-og-v2\.jpg/);
  assert.match(miaPage, /India & Bali in focus/);
  assert.match(miaPage, /MiaSceneGenerator/);
  assert.match(miaPage, /src="\/mia-og-v2\.jpg"/);
  assert.match(sceneStudio, /MIA_DESTINATION_GUIDES/);
  assert.match(sceneStudio, /\/api\/mia\/scene/);
  assert.doesNotMatch(miaPage, /\bGia\b/);
  assert.doesNotMatch(miaPage, /\bMila\b/);
  assert.doesNotMatch(miaPage, /https:\/\/(?:gia|mila)\.purangpt\.com/);
});

test('Mia destination actions, continuity, and media controls are functional rather than decorative', () => {
  assert.match(miaPage, /sceneHref\('Jaipur', 'cafe'\)/);
  assert.match(miaPage, /MOMENT_SCENES/);
  assert.match(miaPage, /lang="hi-IN"/);
  assert.match(sceneStudio, /sceneStorageKey\(record\.uiLanguage\)/);
  assert.match(sceneStudio, /miaSceneResponseSchema\.safeParse/);
  assert.match(sceneStudio, /commitCuratedScene/);
  assert.match(sceneStudio, /listenReply/);
  assert.match(sceneStudio, /prefers-reduced-motion: reduce/);
  assert.match(sceneStudio, /SCENE_REQUEST_TIMEOUT_MS/);
  assert.match(miaSceneRoute, /X-Mia-Retry-After/);
  assert.match(miaSceneRoute, /abortSignal: controller\.signal/);
});

test('Mia and Gia never mount Mila global chrome', () => {
  assert.match(rootLayout, /const showMilaChrome = product === 'mila'/);
  assert.match(rootLayout, /\{showMilaChrome \? <Atmosphere \/> : null\}/);
  assert.match(rootLayout, /\{showMilaChrome \? <MilaGuide \/> : null\}/);
  assert.match(rootLayout, /\{showMilaChrome \? <BottomNav \/> : null\}/);
});

test('Mila owns its learning entry points and shared policies cover every product', () => {
  assert.match(milaHome, /Learn English/);
  assert.match(milaBrand, /name: 'FluentMitra'/);
  assert.match(milaHome, /MILA_PUBLIC_BRAND\.name/);
  assert.match(milaHome, /\/dashboard/);
  assert.doesNotMatch(milaHome, /\bGia\b/);
  assert.doesNotMatch(milaHome, /https:\/\/gia\.purangpt\.com/);
  assert.match(privacy, /mila\.purangpt\.com/);
  assert.match(privacy, /gia\.purangpt\.com/);
  assert.match(privacy, /mia\.purangpt\.com/);
  assert.match(terms, /FluentMitra, Gia, and Mia/);
});

test('Mila entry actions lead forward instead of returning learners to the front door', () => {
  assert.match(milaHome, /Which language should we explain English in/);
  assert.match(milaHome, /params\.get\('chooseLanguage'\)/);
  assert.match(milaHome, /params\.get\('intent'\) === 'guest'/);
  assert.match(milaHome, /entryIntent === 'guest'/);
  assert.doesNotMatch(milaHome, /disabled=\{!selectedLanguage/);
  assert.ok(
    milaHome.indexOf('id="native-language"') < milaHome.indexOf("Opening your learning"),
    'the required language choice must appear before the primary action',
  );
  assert.match(milaLogin, /\/\?chooseLanguage=1&intent=guest/);
  assert.match(milaStart, /nativeLanguage/);
  assert.doesNotMatch(milaDashboard, /router\.push\('\/practice'\)/);
  assert.match(milaDashboard, /router\.push\('\/listen'\)/);
});

test('Mila preserves a deliberate native-language choice through every auth path', () => {
  assert.match(milaLogin, /nativeLanguage \? \{ nativeLanguage \} : \{\}/);
  assert.doesNotMatch(milaLogin, /MILA_LEARNING_PROFILE_STORAGE_KEY/);
  assert.match(milaHome, /languageChosenThisVisit/);
  assert.match(loginRoute, /selectedNativeLanguage/);
  assert.match(loginRoute, /nativeLanguage: selectedNativeLanguage\.name/);
  assert.match(guestRoute, /if \(!isGia && isJsonRequest && !selectedNativeLanguage\)/);
  assert.match(guestRoute, /Existing native clients send a bodyless request/);
  assert.match(milaGuide, /chooseLanguage=1&intent=guest/);
  assert.doesNotMatch(milaGuide, /fetch\('\/api\/auth\/guest'/);
});

test('the landing reports language validation separately from submission failures', () => {
  assert.match(milaHome, /const \[languageError, setLanguageError\]/);
  assert.match(milaHome, /aria-invalid=\{languageError/);
  assert.doesNotMatch(milaHome, /aria-invalid=\{saveError/);
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
  assert.match(middleware, /'\/billing'/);
  assert.match(middleware, /'\/pricing'/);
  assert.match(pricingPage, /GIA LIVE · 30 DAYS/);
  assert.match(pricingPage, /Gia never sees or stores card details/);
  assert.match(billingReturn, /Return to Gia Live/);
});
