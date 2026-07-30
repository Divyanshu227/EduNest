import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminTestsClient } from './AdminTestsClient';

export default async function AdminTestsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects managed by this teacher
  const subjects = await prisma.subject.findMany({
    where: { teacherId: session.user.id },
    orderBy: { sortOrder: 'asc' },
    include: { chapters: { orderBy: { order: 'asc' } } }
  });

  // Get tests, questions, and attempts
  const tests = await prisma.test.findMany({
    where: {
      subjectId: {
        in: subjects.map((s) => s.id)
      }
    },
    include: {
      subject: true,
      chapter: true,
      questions: {
        orderBy: {
          order: 'asc'
        }
      },
      attempts: {
        include: {
          student: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <AdminTestsClient 
      initialTests={tests} 
      subjects={subjects} 
    />
  );
}
