import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscription } = await request.json();

  if (!subscription) {
    return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      deviceTokens: {
        push: JSON.stringify(subscription)
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { deviceTokens: true }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      deviceTokens: (existing?.deviceTokens ?? []).filter((value) => value !== token)
    }
  });

  return NextResponse.json({ ok: true });
}
