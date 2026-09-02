import { prisma } from '@/lib/prisma';
import { notifyUsers } from '@/lib/notifications';

interface ClassReminderOptions {
  classId: string;
  customMessage?: string;
}

interface HomeworkReminderOptions {
  homeworkId: string;
  studentId?: string;
  customMessage?: string;
}

export async function sendClassReminder({ classId, customMessage }: ClassReminderOptions) {
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
    throw new Error('Live class not found');
  }

  // Find linked parents
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

  const title = `🔔 Live Class Reminder: ${liveClass.title}`;
  const body = customMessage || `Your class with ${liveClass.teacher.name || 'your teacher'} is scheduled for ${timeStr}. Click to join the session now!`;

  await notifyUsers(recipients, {
    title,
    body,
    type: 'SYSTEM',
    link: '/student/classes'
  });

  return {
    studentName: studentUser.name,
    parentCount: parentUsers.length,
    title,
    body
  };
}

export async function sendHomeworkReminder({ homeworkId, studentId, customMessage }: HomeworkReminderOptions) {
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
    throw new Error('Homework not found');
  }

  const submittedStudentIds = new Set(homework.submissions.map(s => s.studentId));

  let targetStudentIds: string[] = [];

  if (studentId) {
    targetStudentIds = [studentId];
  } else {
    if (homework.assignedStudentIds && homework.assignedStudentIds.length > 0) {
      targetStudentIds = homework.assignedStudentIds.filter(id => !submittedStudentIds.has(id));
    } else {
      const allStudents = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true }
      });
      targetStudentIds = allStudents.map(s => s.id).filter(id => !submittedStudentIds.has(id));
    }
  }

  if (targetStudentIds.length === 0) {
    return { count: 0, message: 'All students have already submitted their homework.' };
  }

  const targetStudents = await prisma.user.findMany({
    where: { id: { in: targetStudentIds } },
    select: { id: true, name: true, deviceTokens: true }
  });

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

  const title = isPastDue 
    ? `⚠️ Overdue Homework Reminder: ${homework.title}` 
    : `📝 Homework Due Reminder: ${homework.title}`;

  const body = customMessage || (
    isPastDue 
      ? `Your homework submission for ${homework.subject?.name || 'class'} is overdue (was due on ${dueStr}). Please submit your answer sheets immediately!`
      : `Reminder: Homework for ${homework.subject?.name || 'class'} is due on ${dueStr}. Don't forget to submit your answer sheets!`
  );

  await notifyUsers(allRecipients, {
    title,
    body,
    type: 'HOMEWORK',
    link: '/student/homework'
  });

  return {
    studentCount: targetStudents.length,
    parentCount: parentRecipients.length,
    title,
    body
  };
}

/**
 * Process pending scheduled reminders that are due
 */
export async function processDueReminders() {
  try {
    const now = new Date();
    const dueReminders = await (prisma as any).scheduledReminder.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: now }
      },
      take: 20
    });

    if (!dueReminders || dueReminders.length === 0) {
      return { processed: 0 };
    }

    let processedCount = 0;

    for (const reminder of dueReminders) {
      try {
        if (reminder.type === 'CLASS') {
          await sendClassReminder({
            classId: reminder.targetId,
            customMessage: reminder.body || undefined
          });
        } else if (reminder.type === 'HOMEWORK') {
          await sendHomeworkReminder({
            homeworkId: reminder.targetId,
            studentId: reminder.studentId || undefined,
            customMessage: reminder.body || undefined
          });
        }

        await (prisma as any).scheduledReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });
        processedCount++;
      } catch (err: any) {
        console.error(`Failed to execute reminder ${reminder.id}:`, err);
        await (prisma as any).scheduledReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'FAILED',
            updatedAt: new Date()
          }
        });
      }
    }

    return { processed: processedCount };
  } catch (error) {
    console.error('Error processing due reminders:', error);
    return { processed: 0, error };
  }
}
