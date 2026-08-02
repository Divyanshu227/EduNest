import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NotificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Verify authentication and parent role
    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, subject, message, studentId, teacherId } = body;

    if (!topic || !subject || !message || !teacherId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save to database
    const feedback = await prisma.feedback.create({
      data: {
        topic,
        subject,
        message,
        parentId: session.user.id,
        studentId,
        teacherId
      }
    });

    // Optional: Fetch the student name for better context
    let studentContext = '';
    if (studentId) {
      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (student) studentContext = ` regarding student: ${student.name}`;
    }

    // Create a notification for the specific Admin
    await prisma.notification.create({
      data: {
        userId: teacherId,
        title: `[${topic}] from ${session.user.name}`,
        body: `${subject}${studentContext}\n\n${message}`,
        type: NotificationType.SYSTEM,
        link: '/admin/feedback', // Link to admin feedback management page
      }
    });

    return NextResponse.json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
