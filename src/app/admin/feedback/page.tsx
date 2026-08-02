import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminFeedbackClient } from './AdminFeedbackClient';

export default async function AdminFeedbackPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return <div className="p-6">Unauthorized</div>;
  }

  const feedbacks = await prisma.feedback.findMany({
    where: { teacherId: session.user.id },
    include: {
      parent: { select: { name: true, email: true, phone: true } },
      student: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      parents: {
        include: {
          parent: { select: { id: true, name: true } }
        }
      }
    }
  });

  return <AdminFeedbackClient initialFeedbacks={feedbacks} teacherId={session.user.id} students={students} />;
}
