import { NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST() {
  try {
    // Each browser gets an isolated guest learner. Sharing a single database row
    // leaked progress and assessment state between unrelated pilot students.
    const guestId = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: `guest-${guestId}@mila.local`,
        name: 'Гость / Guest',
        password: hashPassword(randomBytes(32).toString('hex')),
        learnerCategory: 'pending',
        nativeLanguage: 'Русский',
        level: 'pending',
        joinDate: new Date(),
      }
    });

    // Set the session token cookie
    await createSession({ sub: user.id.toString(), email: user.email });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
