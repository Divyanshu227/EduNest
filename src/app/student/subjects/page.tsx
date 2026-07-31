import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { StudentSubjectsClient } from './StudentSubjectsClient';

export default async function StudentSubjectsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get all subjects
  const subjects = await prisma.subject.findMany({
    include: {
      chapters: { select: { id: true } },
      notes: { 
        where: {
          OR: [
            { assignedStudentIds: { has: session.user.id } },
            { assignedStudentIds: { isEmpty: true } }
          ]
        },
        select: { id: true } 
      },
      homework: { 
        where: {
          OR: [
            { assignedStudentIds: { has: session.user.id } },
            { assignedStudentIds: { isEmpty: true } }
          ]
        },
        select: { id: true } 
      },
      tests: { 
        where: { isPublished: true },
        select: { id: true } 
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  return (
    <StudentSubjectsClient initialSubjects={subjects} />
  );
}
