// Check one exercise answer against the stored correctAnswer.
// Returns the verdict + the right answer so the UI can teach, not just grade.
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // URL shape: /api/exercises/<id>/check
  const parts = request.nextUrl.pathname.split('/')
  const exerciseId = Number(parts[parts.length - 2] || '0')
  const body = await request.json().catch(() => null)
  const answer = body?.answer
  if (!exerciseId || typeof answer !== 'string') {
    return NextResponse.json({ error: 'missing exercise id or answer' }, { status: 400 })
  }

  const ex = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      Lesson: {
        OR: [{ createdByUserId: Number(user.sub) }, { createdByUserId: null }],
      },
    },
  })
  if (!ex) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const correct = answer.trim().toLowerCase() === ex.correctAnswer.trim().toLowerCase()
  return NextResponse.json({
    correct,
    correctAnswer: ex.correctAnswer,
    hint: ex.hintText || null,
    points: correct ? ex.points : 0,
  })
}
