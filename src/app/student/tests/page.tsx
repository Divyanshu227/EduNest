import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { StudentTestsClient } from './StudentTestsClient';

export default async function StudentTestsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Fetch only published tests, with student's attempts
  const tests = await prisma.test.findMany({
    where: {
      isPublished: true
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
        where: {
          studentId: session.user.id
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <StudentTestsClient 
      tests={tests} 
    />
  );
}
