import { createHmac, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { VISITOR_COOKIE, hasAnalyticsOptOut, isLikelyBot, normalizeTrackedPath, normalizeTrackedSite } from '@/lib/analytics'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 500
const VISITOR_MAX_AGE_SECONDS = 365 * 24 * 60 * 60

function quietResponse(visitorId?: string) {
  const response = new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  })
  if (visitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      maxAge: VISITOR_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return response
}

export async function POST(request: NextRequest) {
  if (hasAnalyticsOptOut(request.headers) || isLikelyBot(request.headers.get('user-agent'))) {
    return quietResponse()
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
  }

  const raw = await request.text().catch(() => '')
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: raw ? 'payload_too_large' : 'invalid_visit' }, { status: raw ? 413 : 400 })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'invalid_visit' }, { status: 400 })
  }

  const path = normalizeTrackedPath(
    typeof body === 'object' && body !== null && 'path' in body ? body.path : null,
  )
  if (!path) return NextResponse.json({ error: 'invalid_visit' }, { status: 400 })

  const hashSecret = process.env.ANALYTICS_HASH_SECRET || process.env.JWT_SECRET
  if (!hashSecret) return quietResponse()

  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value
  const visitorId = existingVisitorId && /^[0-9a-f-]{36}$/i.test(existingVisitorId)
    ? existingVisitorId
    : randomUUID()
  const visitorHash = createHmac('sha256', hashSecret).update(visitorId).digest('hex')
  const site = normalizeTrackedSite(
    request.headers.get('x-forwarded-host') || request.headers.get('host'),
  )
  const day = new Date().toISOString().slice(0, 10)

  await prisma.visitorDay.upsert({
    where: {
      day_site_visitorHash_path: { day, site, visitorHash, path },
    },
    create: { day, site, visitorHash, path },
    update: { views: { increment: 1 } },
  })

  return quietResponse(existingVisitorId ? undefined : visitorId)
}
