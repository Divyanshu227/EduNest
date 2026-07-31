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
      notes: { select: { id: true } },
      homework: { select: { id: true } },
      tests: { select: { id: true } }
    },
    orderBy: { sortOrder: 'asc' }
  });

  return (
    <StudentSubjectsClient initialSubjects={subjects} />
  );
}
