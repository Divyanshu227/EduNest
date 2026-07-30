import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { notifyUsers } from '@/lib/notifications';
import { attendanceSchema } from '@/lib/validators';

export async function GET() {
  const data = await prisma.attendance.findMany({
    orderBy: { date: 'desc' },
    include: { student: { select: { name: true, email: true } }, subject: true, markedBy: { select: { name: true } } }
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const parsed = attendanceSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError(parsed.error.message, 422);
  }

  const attendance = await prisma.attendance.upsert({
    where: {
      studentId_subjectId_date: {
        studentId: parsed.data.studentId,
        subjectId: parsed.data.subjectId,
        date: new Date(parsed.data.date)
      }
    },
    update: {
      status: parsed.data.status,
      note: parsed.data.note,
      markedById: auth.session.user.id
    },
    create: {
      studentId: parsed.data.studentId,
      subjectId: parsed.data.subjectId,
      date: new Date(parsed.data.date),
      status: parsed.data.status,
      note: parsed.data.note,
      markedById: auth.session.user.id
    }
  });

  const recipients = await prisma.user.findMany({
    where: { id: parsed.data.studentId, role: 'STUDENT' },
    select: { id: true, deviceTokens: true }
  });

  await notifyUsers(recipients, {
    title: 'Attendance updated',
    body: `Your attendance was marked ${parsed.data.status.toLowerCase()}.`,
    type: 'ATTENDANCE',
    link: '/student/attendance'
  });

  return NextResponse.json({ data: attendance }, { status: 201 });
}
