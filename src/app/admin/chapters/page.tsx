import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminChaptersClient } from './AdminChaptersClient';

export default async function AdminChaptersPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects managed by this teacher
  const subjects = await prisma.subject.findMany({
    where: { teacherId: session.user.id },
    orderBy: { sortOrder: 'asc' }
  });

  // Get chapters in those subjects
  const chapters = await prisma.chapter.findMany({
    where: {
      subjectId: {
        in: subjects.map((s) => s.id)
      }
    },
    include: {
      subject: true
    },
    orderBy: {
      order: 'asc'
    }
  });

  return (
    <AdminChaptersClient 
      subjects={subjects} 
      initialChapters={chapters} 
    />
  );
}
