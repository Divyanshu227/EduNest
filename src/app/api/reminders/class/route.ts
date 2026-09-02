import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api';
import { notifyUsers } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  const auth = await requireRole(['ADMIN']);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    const { classId } = await request.json();
    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: classId },
      include: {
        student: {
          select: { id: true, name: true, email: true, deviceTokens: true }
        },
        teacher: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!liveClass) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    // Find student parents to also notify them
    const parentLinks = await prisma.parentStudent.findMany({
      where: { studentId: liveClass.studentId },
      include: {
        parent: {
          select: { id: true, deviceTokens: true }
        }
      }
    });

    const studentUser = liveClass.student;
    const parentUsers = parentLinks.map(l => l.parent).filter(Boolean);

    const recipients = [
      { id: studentUser.id, deviceTokens: studentUser.deviceTokens },
      ...parentUsers.map(p => ({ id: p.id, deviceTokens: p.deviceTokens }))
    ];

    const timeStr = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    }).format(new Date(liveClass.startTime));

    await notifyUsers(recipients, {
      title: `🔔 Live Class Reminder: ${liveClass.title}`,
      body: `Your class with ${liveClass.teacher.name || 'your teacher'} is scheduled for ${timeStr}. Click to join the session now!`,
      type: 'SYSTEM',
      link: '/student/classes'
    });

    return NextResponse.json({ 
      success: true, 
      message: `Reminder sent to ${studentUser.name}${parentUsers.length > 0 ? ` and ${parentUsers.length} parent(s)` : ''}.` 
    });
  } catch (error: any) {
    console.error('Failed to send class reminder:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
