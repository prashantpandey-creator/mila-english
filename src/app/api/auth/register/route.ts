import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: body.email }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashPassword(body.password),
        learnerCategory: body.learnerCategory || 'adult',
        nativeLanguage: body.nativeLanguage || 'ru',
        level: body.level || 'beginner',
        joinDate: new Date(),
      }
    })
    
    // Create session
    await createSession({ sub: user.id.toString(), email: user.email })
    
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}