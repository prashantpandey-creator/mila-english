import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = Number(user.sub)

  // Real progress summary for this user only
  const [progresses, sessions, phonemeStats] = await Promise.all([
    prisma.progress.findMany({
      where: { userId },
      include: { Lesson: { select: { title: true, category: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.studySession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: 30,
    }),
    prisma.phonemeStat.findMany({
      where: { userId },
      orderBy: { mastery: 'asc' },
      take: 5,
    }),
  ])

  const completedLessons = progresses.filter(p => p.completed).length
  const totalTimeSeconds = sessions.reduce((sum, s) => {
    if (!s.endTime) return sum
    return sum + Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)
  }, 0)
  const avgScore = progresses.filter(p => p.score != null).length > 0
    ? Math.round(progresses.filter(p => p.score != null).reduce((s, p) => s + (p.score ?? 0), 0) / progresses.filter(p => p.score != null).length)
    : 0

  const weakPhonemes = phonemeStats.map(p => ({
    phoneme: p.phoneme,
    mastery: p.mastery,
    attempts: p.attempts,
    lastAcc: p.lastAcc,
  }))

  return NextResponse.json({
    completedLessons,
    totalTimeSeconds,
    avgScore,
    recentLessons: progresses.slice(0, 5).map(p => ({
      lessonTitle: p.Lesson?.title,
      category: p.Lesson?.category,
      score: p.score,
      completed: p.completed,
      date: p.lastAttemptDate,
    })),
    weakPhonemes,
  })
}

// Record a lesson attempt: one Progress row per (user, lesson), best score kept.
export async function POST(request: NextRequest) {
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const lessonId = Number(body?.lessonId || 0)
  if (!lessonId) return NextResponse.json({ error: 'missing lessonId' }, { status: 400 })
  const userId = Number(user.sub)
  const score = body?.score != null ? Number(body.score) : null
  const completed = Boolean(body?.completed)

  const existing = await prisma.progress.findFirst({ where: { userId, lessonId } })
  const row = existing
    ? await prisma.progress.update({
        where: { id: existing.id },
        data: {
          completed: completed || existing.completed,
          score: score != null ? Math.max(score, existing.score ?? 0) : existing.score,
          lastAttemptDate: new Date(),
        },
      })
    : await prisma.progress.create({
        data: { userId, lessonId, completed, score, lastAttemptDate: new Date() },
      })
  return NextResponse.json(row, { status: existing ? 200 : 201 })
}