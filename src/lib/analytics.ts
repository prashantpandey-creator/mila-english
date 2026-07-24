export const VISITOR_COOKIE = 'mila_visitor'

const INTERNAL_PATH_PREFIXES = ['/api', '/_next']
const INTERNAL_PATHS = new Set([
  '/apple-icon',
  '/favicon.ico',
  '/icon',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js',
])

export function normalizeTrackedPath(input: unknown): string | null {
  if (typeof input !== 'string') return null

  const value = input.trim()
  if (!value.startsWith('/') || value.startsWith('//') || value.length > 300) return null
  if (/[\u0000-\u001f\u007f]/.test(value)) return null

  let path: string
  try {
    path = new URL(value, 'https://mila.invalid').pathname
  } catch {
    return null
  }

  if (path.length > 160) return null
  if (INTERNAL_PATHS.has(path) || INTERNAL_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return null
  }
  return path
}

export function normalizeTrackedSite(input: string | null): string {
  const forwardedHost = input?.split(',')[0]?.trim().toLowerCase() || 'unknown'
  const host = forwardedHost.replace(/:\d+$/, '')
  return /^[a-z0-9.-]{1,120}$/.test(host) ? host : 'unknown'
}

export function hasAnalyticsOptOut(headers: Pick<Headers, 'get'>): boolean {
  return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1'
}

export function isLikelyBot(userAgent: string | null): boolean {
  return !!userAgent && /bot|crawler|spider|headless|preview|facebookexternalhit|slurp/i.test(userAgent)
}
