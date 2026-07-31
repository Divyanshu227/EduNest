import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { SubjectChaptersClient } from './SubjectChaptersClient';
import { notFound } from 'next/navigation';

export default async function SubjectChaptersPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const session = await auth();
  const { subjectId } = await params;

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get the specific subject
  const subject = await prisma.subject.findUnique({
    where: { 
      id: subjectId,
      teacherId: session.user.id 
    }
  });

  if (!subject) {
    return notFound();
  }

  // Get chapters in this subject
  const chapters = await prisma.chapter.findMany({
    where: { subjectId: subject.id },
    include: {
      notes: { select: { id: true } },
      homework: { select: { id: true } },
      tests: { select: { id: true } }
    },
    orderBy: {
      order: 'asc'
    }
  });

  return (
    <SubjectChaptersClient 
      subject={subject} 
      initialChapters={chapters} 
    />
  );
}
