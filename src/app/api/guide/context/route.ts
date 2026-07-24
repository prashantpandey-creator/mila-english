import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COURSE_LESSON_IDS, getBuiltinLesson } from '@/lib/builtinLessons'
import { teacherForNativeLanguage } from '@/lib/learningMarkets'

export async function GET(request: NextRequest) {
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const userId = Number(user.sub)
  const [profile, progresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, level: true, streakDays: true, nativeLanguage: true },
    }),
    prisma.progress.findMany({
      where: { userId },
      include: {
        Lesson: { select: { id: true, title: true, contentKey: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    }),
  ])

  if (!profile) return NextResponse.json({ authenticated: false }, { status: 401 })

  const completedBuiltinIds = new Set(
    progresses
      .filter((progress) => progress.completed && progress.Lesson.contentKey?.startsWith('builtin:'))
      .map((progress) => progress.Lesson.contentKey!.replace('builtin:', '')),
  )

  const active = progresses.find((progress) => !progress.completed)
  let continueHref = '/lessons'
  let continueTitle = 'Choose your next lesson'
  let continueTitleRu = 'Выбрать следующий урок'

  if (profile.level === 'pending') {
    continueHref = '/assessment'
    continueTitle = 'Complete your level check'
    continueTitleRu = 'Пройти проверку уровня'
  } else if (active) {
    const builtinId = active.Lesson.contentKey?.startsWith('builtin:')
      ? active.Lesson.contentKey.replace('builtin:', '')
      : null
    continueHref = builtinId ? `/lessons/${builtinId}` : `/lessons/ai-${active.Lesson.id}`
    continueTitle = `Continue ${active.Lesson.title}`
    continueTitleRu = `Продолжить: ${active.Lesson.title}`
  } else {
    const nextBuiltinId = COURSE_LESSON_IDS.find((id) => !completedBuiltinIds.has(id))
    if (nextBuiltinId) {
      const lesson = getBuiltinLesson(nextBuiltinId)
      continueHref = `/lessons/${nextBuiltinId}`
      continueTitle = lesson ? `Start ${lesson.titleEn}` : 'Start your next lesson'
      continueTitleRu = lesson ? `Начать: ${lesson.titleRu}` : 'Начать следующий урок'
    }
  }

  return NextResponse.json({
    authenticated: true,
    name: profile.name,
    level: profile.level,
    streakDays: profile.streakDays,
    nativeLanguage: profile.nativeLanguage,
    teacherName: teacherForNativeLanguage(profile.nativeLanguage)?.name || null,
    continueHref,
    continueTitle,
    continueTitleRu,
  })
}
