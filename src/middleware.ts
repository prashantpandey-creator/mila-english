import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

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

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();

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
    login.searchParams.set('returnTo', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|visuals|mascot).*)'],
};
