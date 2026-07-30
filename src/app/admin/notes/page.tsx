import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminNotesClient } from './AdminNotesClient';

export default async function AdminNotesPage() {
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

  // Get notes for these subjects
  const notes = await prisma.note.findMany({
    where: {
      subjectId: {
        in: subjects.map((s) => s.id)
      }
    },
    include: {
      subject: true,
      chapter: true
    },
    orderBy: {
      lastUpdated: 'desc'
    }
  });

  return (
    <AdminNotesClient 
      initialNotes={notes} 
      subjects={subjects} 
    />
  );
}
