import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolvePlan, isPaid } from '@/lib/subscription'
import { publicUser } from '@/lib/publicUser'
import { isGiaHostname } from '@/lib/productHosts'
import { resolveIndianNativeLanguage } from '@/lib/learningMarkets'

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
      accountType: true,
      emailVerifiedAt: true,
      plan: true,
      planStatus: true,
      planRenewsAt: true,
      voicePreviewUsedAt: true,
    },
  })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Surface only the learner-safe account contract plus resolved entitlement.
  // Provider/customer identifiers never belong in a browser response.
  const state = resolvePlan(profile)
  return NextResponse.json({
    ...publicUser(profile),
    learnerProfile: profile.learnerProfile,
    learnerProfileAt: profile.learnerProfileAt,
    subscription: {
      plan: state.plan,
      status: state.status,
      active: state.active,
      isPaid: isPaid(state),
      renewsAt: state.renewsAt,
    },
    liveVoicePreviewAvailable: profile.voicePreviewUsedAt === null,
  })
}

export async function PATCH(request: NextRequest) {
  const user = await authenticate(request)
  const userId = Number(user?.sub)
  if (!user || !Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (isGiaHostname(request.headers.get('host'))) {
    return NextResponse.json({ error: 'This setting belongs to Mila English.' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const nativeLanguage = resolveIndianNativeLanguage(body?.nativeLanguage)
  if (!nativeLanguage) {
    return NextResponse.json({
      error: 'Choose a supported native language.',
      code: 'INVALID_NATIVE_LANGUAGE',
    }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { nativeLanguage: nativeLanguage.name },
  })
  return NextResponse.json(publicUser(updated))
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

  if (body?.scope === 'gia' && isGiaHostname(request.headers.get('host'))) {
    await prisma.$transaction([
      prisma.companionThread.deleteMany({ where: { userId, key: 'gia' } }),
      prisma.companionMemory.deleteMany({ where: { userId, product: 'gia' } }),
    ])
    return NextResponse.json({ deleted: true, scope: 'gia' })
  }

  await prisma.$transaction(async (tx) => {
    // A 30-day pass never auto-renews, so there is no remote subscription to
    // cancel. Abandon unpaid checkout attempts; paid financial records are
    // retained without the learner relation for accounting/reconciliation.
    await tx.payment.updateMany({
      where: { userId, status: { in: ['created', 'pending'] } },
      data: { status: 'abandoned' },
    })
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
  });

  (await cookies()).delete('token')
  return NextResponse.json({ deleted: true })
}
