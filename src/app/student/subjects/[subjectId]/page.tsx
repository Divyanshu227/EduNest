import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { StudentSubjectChaptersClient } from './StudentSubjectChaptersClient';

export default async function StudentSubjectChaptersPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const session = await auth();
  const { subjectId } = await params;

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get the specific subject
  const subject = await prisma.subject.findUnique({
    where: { 
      id: subjectId
    }
  });

  if (!subject) {
    return notFound();
  }

  // Get chapters in this subject
  const chapters = await prisma.chapter.findMany({
    where: { subjectId: subject.id },
    include: {
      notes: { 
        where: { assignedStudentIds: { has: session.user.id } },
        select: { id: true } 
      },
      homework: { 
        where: { assignedStudentIds: { has: session.user.id } },
        select: { id: true } 
      },
      tests: { 
        where: { isPublished: true },
        select: { id: true } 
      }
    },
    orderBy: {
      order: 'asc'
    }
  });

  return (
    <StudentSubjectChaptersClient 
      subject={subject} 
      chapters={chapters} 
    />
  );
}
