import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { StudentNotesClient } from './StudentNotesClient';

export default async function StudentNotesPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects, chapters, notes, and the student's reading progress
  const subjects = await prisma.subject.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      chapters: { orderBy: { order: 'asc' } }
    }
  });

  const notes = await prisma.note.findMany({
    include: {
      subject: true,
      chapter: true
    },
    orderBy: {
      lastUpdated: 'desc'
    }
  });

  const readingProgress = await prisma.readingProgress.findMany({
    where: { userId: session.user.id }
  });

  return (
    <StudentNotesClient 
      subjects={subjects} 
      notes={notes} 
      progress={readingProgress} 
    />
  );
}
