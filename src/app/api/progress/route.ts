import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { builtinLessonContent, getBuiltinLesson } from '@/lib/builtinLessons'

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
  const sessionTimeSeconds = sessions.reduce((sum, s) => {
    if (!s.endTime) return sum
    return sum + Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)
  }, 0)
  const progressTimeSeconds = progresses.reduce((sum, progress) => sum + (progress.timeSpentSeconds ?? 0), 0)
  const totalTimeSeconds = sessionTimeSeconds + progressTimeSeconds
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
  const userId = Number(user.sub)
  const score = body?.score != null ? Number(body.score) : null
  const completed = Boolean(body?.completed)
  const timeSpentSeconds = body?.timeSpentSeconds != null ? Number(body.timeSpentSeconds) : null

  if (score != null && (!Number.isFinite(score) || score < 0 || score > 100)) {
    return NextResponse.json({ error: 'score must be between 0 and 100' }, { status: 400 })
  }
  if (timeSpentSeconds != null && (!Number.isSafeInteger(timeSpentSeconds) || timeSpentSeconds < 0 || timeSpentSeconds > 86400)) {
    return NextResponse.json({ error: 'invalid timeSpentSeconds' }, { status: 400 })
  }

  let lessonId = Number(body?.lessonId || 0)
  const builtin = body?.builtinId ? getBuiltinLesson(String(body.builtinId)) : null
  if (body?.builtinId && !builtin) {
    return NextResponse.json({ error: 'unknown builtinId' }, { status: 400 })
  }

  if (builtin) {
    const lesson = await prisma.lesson.upsert({
      where: { contentKey: `builtin:${builtin.id}` },
      create: {
        contentKey: `builtin:${builtin.id}`,
        title: builtin.titleEn,
        category: builtin.categoryEn,
        learnerLevel: builtin.difficulty === 1 ? 'A1' : builtin.difficulty === 2 ? 'A2' : 'B1',
        durationMinutes: builtin.durationMinutes,
        content: builtinLessonContent(builtin),
        difficulty: builtin.difficulty,
      },
      update: {
        title: builtin.titleEn,
        category: builtin.categoryEn,
        durationMinutes: builtin.durationMinutes,
        content: builtinLessonContent(builtin),
        difficulty: builtin.difficulty,
      },
    })
    lessonId = lesson.id
  } else {
    if (!Number.isSafeInteger(lessonId) || lessonId <= 0) {
      return NextResponse.json({ error: 'missing lessonId or builtinId' }, { status: 400 })
    }
    const accessible = await prisma.lesson.findFirst({
      where: { id: lessonId, OR: [{ createdByUserId: userId }, { createdByUserId: null }] },
      select: { id: true },
    })
    if (!accessible) return NextResponse.json({ error: 'lesson not found' }, { status: 404 })
  }

  const existing = await prisma.progress.findFirst({ where: { userId, lessonId } })
  const row = existing
    ? await prisma.progress.update({
        where: { id: existing.id },
        data: {
          completed: completed || existing.completed,
          score: score != null ? Math.max(score, existing.score ?? 0) : existing.score,
          timeSpentSeconds: timeSpentSeconds != null ? Math.max(timeSpentSeconds, existing.timeSpentSeconds ?? 0) : existing.timeSpentSeconds,
          lastAttemptDate: new Date(),
        },
      })
    : await prisma.progress.create({
        data: { userId, lessonId, completed, score, timeSpentSeconds, lastAttemptDate: new Date() },
      })
  return NextResponse.json(row, { status: existing ? 200 : 201 })
}
