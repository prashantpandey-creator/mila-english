import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'dev-secret-change-me'
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING)

export async function authenticate(request?: NextRequest) {
  let token: string | undefined = undefined;
  
  if (request) {
    token = request.headers.get('Authorization')?.replace('Bearer ', '')
  }
  
  if (!token) {
    token = (await cookies()).get('token')?.value
  }
  
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { sub: string; role?: string; email?: string }
  } catch {
    return null
  }
}

export async function createSession(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
    
  (await cookies()).set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  return token;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return key === hash
}

export function requireRole(user: any, ...roles: string[]) {
  if (!user) return false
  return roles.length === 0 || roles.includes(user.role)
}
