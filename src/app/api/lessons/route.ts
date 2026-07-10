import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = Number(user.sub)

  // Return the user's own AI-generated lessons (from assessments) plus
  // any global lessons (userId = null, e.g. curated content). Most recent first.
  const items = await prisma.lesson.findMany({
    where: { OR: [{ createdByUserId: userId }, { createdByUserId: null }] },
    include: { Exercises: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(items)
}