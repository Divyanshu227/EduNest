import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser, jsonError } from '@/lib/api';
import { processDueReminders } from '@/lib/reminder-scheduler';

export async function GET() {
  const auth = await requireUser();

  if ('error' in auth) {
    return auth.error;
  }

  // Trigger background check for any scheduled reminders that have reached their trigger time
  processDueReminders().catch(err => console.error('Background reminder check error:', err));

  let userIds = [auth.session.user.id];

  if (auth.session.user.role === 'PARENT') {
    const parentLinks = await prisma.parentStudent.findMany({
      where: { parentId: auth.session.user.id },
      select: { studentId: true }
    });
    userIds = [...userIds, ...parentLinks.map(p => p.studentId)];
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: { in: userIds } },
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

    let userIds = [auth.session.user.id];
    if (auth.session.user.role === 'PARENT') {
      const parentLinks = await prisma.parentStudent.findMany({
        where: { parentId: auth.session.user.id },
        select: { studentId: true }
      });
      userIds = [...userIds, ...parentLinks.map(p => p.studentId)];
    }

    if (notificationId) {
      // First, find the notification to ensure we have permission to update it
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId: { in: userIds } }
      });

      if (!notification) {
        return jsonError('Notification not found or unauthorized', 404);
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() }
      });
      return NextResponse.json({ data: updated });
    } else {
      const updated = await prisma.notification.updateMany({
        where: { userId: { in: userIds }, readAt: null },
        data: { readAt: new Date() }
      });
      return NextResponse.json({ data: updated });
    }
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}