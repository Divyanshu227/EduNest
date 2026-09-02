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
    const { homeworkId, studentId } = await request.json();
    if (!homeworkId) {
      return NextResponse.json({ error: 'homeworkId is required' }, { status: 400 });
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        subject: true,
        submissions: {
          select: { studentId: true }
        }
      }
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    const submittedStudentIds = new Set(homework.submissions.map(s => s.studentId));

    // Determine target students
    let targetStudentIds: string[] = [];

    if (studentId) {
      targetStudentIds = [studentId];
    } else {
      // All assigned students who haven't submitted yet
      if (homework.assignedStudentIds && homework.assignedStudentIds.length > 0) {
        targetStudentIds = homework.assignedStudentIds.filter(id => !submittedStudentIds.has(id));
      } else {
        // If assigned to all students in database
        const allStudents = await prisma.user.findMany({
          where: { role: 'STUDENT' },
          select: { id: true }
        });
        targetStudentIds = allStudents.map(s => s.id).filter(id => !submittedStudentIds.has(id));
      }
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json({ success: true, message: 'All students have already submitted their homework.' });
    }

    // Fetch target students with deviceTokens
    const targetStudents = await prisma.user.findMany({
      where: { id: { in: targetStudentIds } },
      select: { id: true, name: true, deviceTokens: true }
    });

    // Also fetch parents of these students
    const parentLinks = await prisma.parentStudent.findMany({
      where: { studentId: { in: targetStudentIds } },
      include: {
        parent: {
          select: { id: true, deviceTokens: true }
        }
      }
    });

    const studentRecipients = targetStudents.map(s => ({ id: s.id, deviceTokens: s.deviceTokens }));
    const parentRecipients = parentLinks.map(l => l.parent).filter(Boolean).map(p => ({ id: p.id, deviceTokens: p.deviceTokens }));

    const allRecipients = [...studentRecipients, ...parentRecipients];

    const dueStr = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    }).format(new Date(homework.dueDate));

    const isPastDue = new Date() > new Date(homework.dueDate);

    await notifyUsers(allRecipients, {
      title: isPastDue 
        ? `⚠️ Overdue Homework Reminder: ${homework.title}` 
        : `📝 Homework Due Reminder: ${homework.title}`,
      body: isPastDue 
        ? `Your homework submission for ${homework.subject?.name || 'class'} is overdue (was due on ${dueStr}). Please submit your answer sheets immediately!`
        : `Reminder: Homework for ${homework.subject?.name || 'class'} is due on ${dueStr}. Don't forget to submit your answer sheets!`,
      type: 'HOMEWORK',
      link: '/student/homework'
    });

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${targetStudents.length} student(s) and ${parentRecipients.length} parent(s).`
    });
  } catch (error: any) {
    console.error('Failed to send homework reminder:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
