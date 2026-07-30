import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser, jsonError } from '@/lib/api';

export async function GET() {
  const auth = await requireUser();

  if ('error' in auth) {
    return auth.error;
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ data: notifications });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const body = await request.json();

  if (!body?.userId || !body?.title || !body?.body || !body?.type) {
    return jsonError('Missing notification fields', 422);
  }

  const notification = await prisma.notification.create({
    data: {
      userId: body.userId,
      title: body.title,
      body: body.body,
      type: body.type,
      link: body.link ?? null
    }
  });

  return NextResponse.json({ data: notification }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();

  if ('error' in auth) {
    return auth.error;
  }

  try {
    const { notificationId } = await request.json();

    if (notificationId) {
      const updated = await prisma.notification.update({
        where: { id: notificationId, userId: auth.session.user.id },
        data: { readAt: new Date() }
      });
      return NextResponse.json({ data: updated });
    } else {
      const updated = await prisma.notification.updateMany({
        where: { userId: auth.session.user.id, readAt: null },
        data: { readAt: new Date() }
      });
      return NextResponse.json({ data: updated });
    }
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}