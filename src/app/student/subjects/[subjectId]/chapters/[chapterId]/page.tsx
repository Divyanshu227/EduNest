import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { StudentChapterDashboardClient } from './StudentChapterDashboardClient';

export default async function StudentChapterDashboardPage({ params }: { params: Promise<{ subjectId: string; chapterId: string }> }) {
  const session = await auth();
  const { subjectId, chapterId } = await params;

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get chapter details
  const chapter = await prisma.chapter.findUnique({
    where: { 
      id: chapterId,
      subjectId: subjectId
    },
    include: {
      subject: true
    }
  });

  if (!chapter) {
    return notFound();
  }

  // Fetch only content assigned to this student or published
  const [notes, homeworks, tests] = await Promise.all([
    prisma.note.findMany({
      where: { 
        chapterId,
        OR: [
          { assignedStudentIds: { has: session.user.id } },
          { assignedStudentIds: { isEmpty: true } }
        ]
      },
      include: {
        subject: { select: { name: true, color: true } },
        chapter: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.homework.findMany({
      where: { 
        chapterId,
        OR: [
          { assignedStudentIds: { has: session.user.id } },
          { assignedStudentIds: { isEmpty: true } }
        ]
      },
      include: {
        subject: { select: { name: true, color: true } },
        chapter: { select: { name: true } },
        submissions: {
          where: { studentId: session.user.id }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.test.findMany({
      where: { 
        chapterId,
        isPublished: true
      },
      include: {
        subject: { select: { name: true, color: true } },
        chapter: { select: { name: true } },
        questions: true,
        attempts: {
          where: { studentId: session.user.id }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <StudentChapterDashboardClient
      chapter={chapter}
      subject={chapter.subject}
      notes={notes}
      homeworks={homeworks}
      tests={tests}
    />
  );
}
