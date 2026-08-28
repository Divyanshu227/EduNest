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
    where: {
      OR: [
        { studentId: session.user.id },
        { assignedStudentIds: { has: session.user.id } },
        {
          AND: [
            { studentId: null },
            { assignedStudentIds: { isEmpty: true } }
          ]
        }
      ]
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      chapters: { orderBy: { order: 'asc' } }
    }
  });

  const notes = await prisma.note.findMany({
    where: {
      OR: [
        { assignedStudentIds: { has: session.user.id } },
        { assignedStudentIds: { isEmpty: true } }
      ]
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
    <StudentNotesClient 
      subjects={subjects} 
      notes={notes} 
    />
  );
}
