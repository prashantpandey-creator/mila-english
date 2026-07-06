import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST() {
  try {
    const email = 'guest@purangpt.com';
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: 'Гость / Guest',
          password: hashPassword('guest-password-123-xyz'),
          learnerCategory: 'pending',
          nativeLanguage: 'Русский',
          level: 'pending',
          joinDate: new Date(),
        }
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { level: 'pending', learnerCategory: 'pending', learnerProfile: null }
      });
    }

    // Set the session token cookie
    await createSession({ sub: user.id.toString(), email: user.email });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
