import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notifyUsers } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;
    let classes;

    if (role === 'ADMIN') {
      // Admin sees classes they scheduled (optionally filtered by student)
      const studentId = request.nextUrl.searchParams.get('studentId');
      const where: any = { teacherId: session.user.id };
      if (studentId) {
        where.studentId = studentId;
      }

      classes = await prisma.liveClass.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startTime: 'asc' },
      });
    } else {
      // Student sees classes assigned to them
      classes = await prisma.liveClass.findMany({
        where: { studentId: session.user.id },
        include: {
          teacher: { select: { name: true, email: true } },
        },
        orderBy: { startTime: 'asc' },
      });
    }

    return NextResponse.json({ data: classes });
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, meetLink, startTime, durationMin, studentId } = body;

    if (!title || !meetLink || !startTime || !durationMin || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const scheduledTime = new Date(startTime);

    const newClass = await prisma.liveClass.create({
      data: {
        title,
        meetLink,
        startTime: scheduledTime,
        durationMin: Number(durationMin),
        studentId,
        teacherId: session.user.id,
      },
      include: {
        student: { select: { name: true, email: true } },
      },
    });

    // Handle reminder scheduling
    const { reminderTiming = '15min', customReminderTime } = body;

    if (reminderTiming === 'immediate') {
      const recipients = await prisma.user.findMany({
        where: { id: studentId, role: 'STUDENT' },
        select: { id: true, deviceTokens: true }
      });

      const when = new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      }).format(scheduledTime);

      await notifyUsers(recipients, {
        title: `🔔 Class Reminder: ${title}`,
        body: `${session.user.name ?? 'Teacher'} scheduled ${title} class at ${when}. Click to view.`,
        type: 'SYSTEM',
        link: '/student/classes'
      });
    } else if (reminderTiming !== 'none') {
      let triggerTime: Date;
      if (reminderTiming === '30min') {
        triggerTime = new Date(scheduledTime.getTime() - 30 * 60000);
      } else if (reminderTiming === '1hr') {
        triggerTime = new Date(scheduledTime.getTime() - 60 * 60000);
      } else if (reminderTiming === 'custom' && customReminderTime) {
        triggerTime = new Date(customReminderTime);
      } else {
        // default 15min
        triggerTime = new Date(scheduledTime.getTime() - 15 * 60000);
      }

      await (prisma as any).scheduledReminder.create({
        data: {
          type: 'CLASS',
          targetId: newClass.id,
          studentId: studentId,
          scheduledFor: triggerTime,
          status: 'PENDING',
          createdBy: session.user.id
        }
      });
    }

    return NextResponse.json({ data: newClass });
  } catch (error) {
    console.error('Failed to schedule class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
