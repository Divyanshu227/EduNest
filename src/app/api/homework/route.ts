import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser, jsonError } from '@/lib/api';
import { getStudentRecipients, notifyUsers } from '@/lib/notifications';
import { homeworkSchema } from '@/lib/validators';

export async function GET() {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  const homework = await prisma.homework.findMany({
    where: session.session.user.role === 'STUDENT' ? {
      OR: [
        { assignedStudentIds: { isEmpty: true } },
        { assignedStudentIds: { has: session.session.user.id } }
      ]
    } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { subject: true, chapter: true, submissions: true }
  });

  return NextResponse.json({ data: homework });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const rawBody = await request.json();
  const parsed = homeworkSchema.safeParse(rawBody);

  if (!parsed.success) {
    return jsonError(parsed.error.message, 422);
  }

  const { reminderTiming = '1day', customReminderTime } = rawBody;
  const dueDate = new Date(parsed.data.dueDate);

  const homework = await prisma.homework.create({
    data: {
      ...parsed.data,
      authorId: auth.session.user.id,
      dueDate: dueDate
    }
  });

  if (reminderTiming === 'immediate') {
    const recipients = await prisma.user.findMany({
      where: {
        ...(parsed.data.assignedStudentIds && parsed.data.assignedStudentIds.length > 0
          ? { id: { in: parsed.data.assignedStudentIds } }
          : {}),
        role: 'STUDENT'
      }
    });

    await notifyUsers(recipients, {
      title: `New homework: ${parsed.data.title}`,
      body: 'A new homework assignment has been posted.',
      type: 'HOMEWORK',
      link: '/student/homework'
    });
  } else if (reminderTiming !== 'none') {
    let triggerTime: Date;
    if (reminderTiming === '2hr') {
      triggerTime = new Date(dueDate.getTime() - 120 * 60000);
    } else if (reminderTiming === '30min') {
      triggerTime = new Date(dueDate.getTime() - 30 * 60000);
    } else if (reminderTiming === 'custom' && customReminderTime) {
      triggerTime = new Date(customReminderTime);
    } else {
      // default 1day
      triggerTime = new Date(dueDate.getTime() - 24 * 60 * 60000);
    }

    await (prisma as any).scheduledReminder.create({
      data: {
        type: 'HOMEWORK',
        targetId: homework.id,
        scheduledFor: triggerTime,
        status: 'PENDING',
        createdBy: auth.session.user.id
      }
    });
  }

  return NextResponse.json({ data: homework }, { status: 201 });
}
