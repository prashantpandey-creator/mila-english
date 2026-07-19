import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const pbkdf2Async = promisify(pbkdf2);
const PASSWORD_ITERATIONS = 210_000;
const PASSWORD_BYTES = 64;
const PASSWORD_ALGORITHM = 'sha512';
const DEV_JWT_SECRET = 'dev-secret-change-me';

export const DUMMY_PASSWORD_HASH = 'pbkdf2-sha512$210000$00000000000000000000000000000000$f024049bd334f3cbca8313b76520b331b22d4055f167e2e65430dc30e9142f25174289031bb8f68fd9dd25fadbb831d4ec5dfa4d2d39498878d5d595dbc47963';

export type MilaSession = JWTPayload & {
  sub: string;
  email: string;
  role?: string;
  sv: number;
  accountType: 'guest' | 'registered';
};

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isGuestIdentity(accountType: string | null | undefined, email: string): boolean {
  if (accountType === 'guest') return true;
  if (accountType === 'registered') return false;
  return /^guest-[0-9a-f-]+@mila\.local$/i.test(email);
}

function jwtSecret(): Uint8Array {
  const configured = process.env.JWT_SECRET?.trim();
  const unsafe = !configured || configured === DEV_JWT_SECRET || configured.length < 32;
  if (process.env.NODE_ENV === 'production' && unsafe) {
    throw new Error('JWT_SECRET must be configured with at least 32 random characters in production.');
  }
  return new TextEncoder().encode(unsafe ? DEV_JWT_SECRET : configured);
}

function bearerToken(request?: NextRequest | Request): string | undefined {
  const value = request?.headers.get('Authorization');
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : undefined;
}

/**
 * Verify both the JWT and its database-backed session version. Legacy tokens
 * without `sv` remain valid only while the user's version is still zero, so
 * rollout does not unexpectedly sign out every current learner.
 */
export async function authenticate(request?: NextRequest | Request): Promise<MilaSession | null> {
  const token = bearerToken(request) || (await cookies()).get('token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, accountType: true, sessionVersion: true },
    });
    if (!user) return null;

    const tokenVersion = Number(payload.sv ?? 0);
    if (!Number.isSafeInteger(tokenVersion) || tokenVersion !== user.sessionVersion) return null;

    return {
      ...payload,
      sub: String(user.id),
      email: user.email,
      sv: user.sessionVersion,
      accountType: isGuestIdentity(user.accountType, user.email) ? 'guest' : 'registered',
    } as MilaSession;
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: number;
  email: string;
  sessionVersion?: number | null;
  accountType?: string | null;
  role?: string;
}) {
  const sessionVersion = user.sessionVersion ?? 0;
  const token = await new SignJWT({
    email: user.email,
    role: user.role,
    sv: sessionVersion,
    accountType: isGuestIdentity(user.accountType, user.email) ? 'guest' : 'registered',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(jwtSecret());

  (await cookies()).set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return token;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await pbkdf2Async(password, salt, PASSWORD_ITERATIONS, PASSWORD_BYTES, PASSWORD_ALGORITHM);
  return `pbkdf2-sha512$${PASSWORD_ITERATIONS}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  let salt = '';
  let expectedHex = '';
  let iterations = PASSWORD_ITERATIONS;

  const versioned = storedHash.split('$');
  if (versioned.length === 4 && versioned[0] === 'pbkdf2-sha512') {
    iterations = Number(versioned[1]);
    salt = versioned[2];
    expectedHex = versioned[3];
  } else {
    // Legacy Mila hashes were `salt:hash` with 1,000 PBKDF2-SHA512 rounds.
    const legacy = storedHash.split(':');
    if (legacy.length !== 2) return false;
    [salt, expectedHex] = legacy;
    iterations = 1_000;
  }

  if (!salt || !/^[a-f0-9]{128}$/i.test(expectedHex) || !Number.isSafeInteger(iterations) || iterations < 1_000 || iterations > 1_000_000) {
    return false;
  }

  const actual = await pbkdf2Async(password, salt, iterations, PASSWORD_BYTES, PASSWORD_ALGORITHM);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function passwordNeedsUpgrade(storedHash: string): boolean {
  const [version, iterations] = storedHash.split('$');
  return version !== 'pbkdf2-sha512' || Number(iterations) !== PASSWORD_ITERATIONS;
}

export function requireRole(user: MilaSession | null, ...roles: string[]) {
  if (!user) return false;
  return roles.length === 0 || (!!user.role && roles.includes(user.role));
}
