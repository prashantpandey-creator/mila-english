import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (user) {
    await prisma.user.updateMany({
      where: { id: Number(user.sub), sessionVersion: user.sv },
      data: { sessionVersion: { increment: 1 } },
    });
  }
  (await cookies()).delete('token');
  return NextResponse.json({ success: true });
}
