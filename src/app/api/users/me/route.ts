// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const profile = await prisma.user.findUnique({
    where: { id: Number(user.id) },
    select: { id: true, name: true, email: true, learnerCategory: true, nativeLanguage: true, level: true, streakDays: true }
  })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(profile)
}