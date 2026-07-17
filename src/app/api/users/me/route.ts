import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await authenticate(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.user.findUnique({
    where: { id: Number(user.sub) },
    select: {
      id: true,
      name: true,
      email: true,
      learnerCategory: true,
      nativeLanguage: true,
      level: true,
      streakDays: true,
      learnerProfile: true,
      learnerProfileAt: true,
    },
  })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request)
  const userId = Number(user?.sub)
  if (!user || !Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (body?.confirmation !== 'DELETE') {
    return NextResponse.json({ error: 'Deletion confirmation is required' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.companionMessage.deleteMany({ where: { Thread: { userId } } })
    await tx.companionThread.deleteMany({ where: { userId } })
    await tx.companionMemory.deleteMany({ where: { userId } })
    await tx.wordReview.deleteMany({ where: { userId } })
    await tx.phonemeStat.deleteMany({ where: { userId } })
    await tx.achievement.deleteMany({ where: { userId } })
    await tx.assessment.deleteMany({ where: { userId } })
    await tx.studySession.deleteMany({ where: { userId } })

    // Generated lessons belong to the learner. Remove dependent attempts and
    // exercises before deleting those lessons, then remove the learner's own
    // remaining progress rows.
    await tx.progress.deleteMany({ where: { Lesson: { createdByUserId: userId } } })
    await tx.exercise.deleteMany({ where: { Lesson: { createdByUserId: userId } } })
    await tx.lesson.deleteMany({ where: { createdByUserId: userId } })
    await tx.progress.deleteMany({ where: { userId } })
    await tx.user.delete({ where: { id: userId } })
  })

  (await cookies()).delete('token')
  return NextResponse.json({ deleted: true })
}
