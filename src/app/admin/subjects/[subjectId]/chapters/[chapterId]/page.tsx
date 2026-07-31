import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ChapterDashboardClient } from './ChapterDashboardClient';
import { notFound } from 'next/navigation';

export default async function ChapterDashboardPage({ params }: { params: Promise<{ subjectId: string; chapterId: string }> }) {
  const session = await auth();
  const { subjectId, chapterId } = await params;

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subject and chapter details to verify ownership and existence
  const chapter = await prisma.chapter.findUnique({
    where: { 
      id: chapterId,
      subjectId: subjectId
    },
    include: {
      subject: true
    }
  });

  if (!chapter || chapter.subject.teacherId !== session.user.id) {
    return notFound();
  }

  // We need to fetch the notes, homework, tests, and students for this chapter to pass to the client components.
  // We can fetch them all in parallel.
  const [notes, homeworks, tests, students, allSubjects] = await Promise.all([
    prisma.note.findMany({
      where: { chapterId },
      include: {
        subject: { select: { name: true, color: true } },
        chapter: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.homework.findMany({
      where: { chapterId },
      include: {
        subject: { select: { name: true, color: true } },
        chapter: { select: { name: true } },
        submissions: {
          include: {
            student: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.test.findMany({
      where: { chapterId },
      include: {
        subject: { select: { name: true, color: true } },
        chapter: { select: { name: true } },
        questions: true,
        attempts: {
          include: {
            student: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    }),
    prisma.subject.findMany({
      where: { teacherId: session.user.id },
      include: {
        chapters: {
          select: { id: true, name: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
  ]);

  return (
    <ChapterDashboardClient
      chapter={chapter}
      subject={chapter.subject}
      notes={notes}
      homeworks={homeworks}
      tests={tests}
      students={students}
      allSubjects={allSubjects}
    />
  );
}
