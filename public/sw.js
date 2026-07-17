// Mila service worker — makes the PWA install real without ever poisoning a
// deploy. Strategy: cache-first for IMMUTABLE static assets only (hashed Next
// chunks, ambience media, mascot art, Google Fonts). Pages and /api/* are never
// intercepted — they always hit the network, so a new deploy is visible on the
// next load and no stale HTML can pin users to an old build.
const CACHE = 'mila-static-v2'

const CACHEABLE = [
  /^\/_next\/static\//,          // content-hashed build chunks — immutable
  /^\/ambience\//,               // backdrop stills + clips
  /^\/visuals\//,                // versioned commissioned campaign artwork
  /^\/mascot\//,                 // mascot art
  /^\/audio\//,                  // baked accent phrases
]

const CACHEABLE_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
])

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin
  const isStatic = sameOrigin
    ? CACHEABLE.some((re) => re.test(url.pathname))
    : CACHEABLE_HOSTS.has(url.hostname)

  if (!isStatic) return // pages, /api/*, everything else: straight to network

  event.respondWith((async () => {
    const cached = await caches.match(request)
    if (cached) return cached
    const response = await fetch(request)
    // Cache only clean 200s (opaque font responses from gstatic are also fine to keep)
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(CACHE)
      cache.put(request, response.clone())
    }
    return response
  })())
})
