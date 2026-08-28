import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminSubjectsClient } from './AdminSubjectsClient';

export default async function AdminSubjectsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects managed by this teacher
  const [subjects, students] = await Promise.all([
    prisma.subject.findMany({
      where: { teacherId: session.user.id },
      include: {
        chapters: true,
        notes: true,
        homework: true,
        tests: true,
        student: { select: { id: true, name: true, email: true } }
      },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    })
  ]);

  // Map homework relation to match interface naming
  const formattedSubjects = subjects.map(s => ({
    ...s,
    homeworks: s.homework
  }));

  return (
    <AdminSubjectsClient 
      initialSubjects={formattedSubjects as any} 
      students={students}
    />
  );
}
