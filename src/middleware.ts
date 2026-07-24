import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import {
  GIA_ORIGIN,
  MILA_ORIGIN,
  MIA_ORIGIN,
  isGiaHostname,
  isMilaHostname,
  isMiaHostname,
} from '@/lib/productHosts';

// The app is login-gated. Everything that IS the product (voice rooms, chat,
// lessons, dashboard, account, billing…) requires a session — registered OR an
// explicitly chosen guest. Only the marketing/legal/auth front stays public
// (`/`, `/start`, `/pricing`, `/login`, `/register`, `/forgot-password`,
// `/reset-password`, `/verify-email`, `/privacy`, `/terms`, `/refunds`,
// `/support`). `/darshan` — the main voice room, previously guest-open — is now
// behind the wall so a person must sign in or deliberately continue as a guest.
const PROTECTED_PREFIXES = [
  '/account',
  '/achievements',
  '/assessment',
  '/billing',
  '/chat',
  '/darshan',
  '/dashboard',
  '/grammar',
  '/lessons',
  '/listen',
  '/phonetics',
  '/practice',
  '/progress',
  '/vocabulary',
  '/voice-lab',
];

const GIA_OWNED_PREFIXES = [
  '/account',
  '/chat',
  '/darshan',
  '/forgot-password',
  '/login',
  '/privacy',
  '/register',
  '/reset-password',
  '/terms',
  '/verify-email',
];

const MIA_OWNED_PREFIXES = ['/privacy', '/terms'];

const MILA_FOREIGN_PREFIXES = ['/chat', '/darshan', '/mia', '/pia'];

const PUBLIC_ASSET_PREFIXES = [
  '/_next',
  '/ambience',
  '/audio',
  '/avatar',
  '/favicon.ico',
  '/icon',
  '/apple-icon',
  '/manifest.webmanifest',
  '/mascot',
  '/mia-og.png',
  '/mia-og-v2.jpg',
  '/og.png',
  '/sw.js',
  '/visuals',
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtected(pathname: string) {
  return matchesPrefix(pathname, PROTECTED_PREFIXES);
}

function redirectToOrigin(request: NextRequest, origin: string, pathname = request.nextUrl.pathname) {
  return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, origin));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host');

  if (matchesPrefix(pathname, PUBLIC_ASSET_PREFIXES)) return NextResponse.next();

  // Product ownership is enforced before authentication. A URL on the wrong
  // hostname must never quietly render another product's page or chrome.
  if (isMiaHostname(host)) {
    const owned = pathname === '/' || matchesPrefix(pathname, MIA_OWNED_PREFIXES);
    if (!owned) return redirectToOrigin(request, MIA_ORIGIN, '/');
  }

  if (isGiaHostname(host)) {
    if (pathname === '/darshan') return redirectToOrigin(request, GIA_ORIGIN, '/');
    const owned = pathname === '/' || matchesPrefix(pathname, GIA_OWNED_PREFIXES);
    if (!owned) return redirectToOrigin(request, GIA_ORIGIN, '/');
  }

  if (isMilaHostname(host) && matchesPrefix(pathname, MILA_FOREIGN_PREFIXES)) {
    return redirectToOrigin(request, MILA_ORIGIN, '/');
  }

  // Gia's apex is internally rewritten to the protected voice room. Gate it
  // before the host rewrite runs. Mia's traveler apex remains public.
  const giaApex = isGiaHostname(host) && pathname === '/';
  if (!isProtected(pathname) && !giaApex) return NextResponse.next();

  const token = request.cookies.get('token')?.value;
  const configured = process.env.JWT_SECRET?.trim();
  const unsafeSecret = !configured || configured === 'dev-secret-change-me' || configured.length < 32;

  if (process.env.NODE_ENV === 'production' && unsafeSecret) {
    return new NextResponse('Authentication is not configured.', { status: 503 });
  }

  try {
    if (!token) throw new Error('missing');
    await jwtVerify(token, new TextEncoder().encode(unsafeSecret ? 'dev-secret-change-me' : configured!));
    return NextResponse.next();
  } catch {
    const login = new URL('/login', request.url);
    login.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|visuals|mascot).*)'],
};
