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
    const { topic, subject, message, studentId } = body;

    if (!topic || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Optional: Fetch the student name for better context
    let studentContext = '';
    if (studentId) {
      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (student) studentContext = ` regarding student: ${student.name}`;
    }

    // Get all Admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    // Create a notification for each Admin
    const notificationPromises = admins.map(admin => {
      return prisma.notification.create({
        data: {
          userId: admin.id,
          title: `[${topic}] from ${session.user.name}`,
          body: `${subject}${studentContext}\n\n${message}`,
          type: NotificationType.SYSTEM,
          link: '/admin', // Link to admin dashboard or potentially a future feedback management page
        }
      });
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
