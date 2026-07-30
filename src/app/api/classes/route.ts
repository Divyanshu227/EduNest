import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;
    let classes;

    if (role === 'ADMIN') {
      // Admin sees classes they scheduled
      classes = await prisma.liveClass.findMany({
        where: { teacherId: session.user.id },
        include: {
          student: { select: { name: true, email: true } },
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

    const newClass = await prisma.liveClass.create({
      data: {
        title,
        meetLink,
        startTime: new Date(startTime),
        durationMin: Number(durationMin),
        studentId,
        teacherId: session.user.id,
      },
      include: {
        student: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ data: newClass });
  } catch (error) {
    console.error('Failed to schedule class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
