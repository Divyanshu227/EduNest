import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { QuizEngine } from './QuizEngine';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentQuizPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Find the test along with its questions
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      subject: true,
      chapter: true,
      questions: {
        orderBy: {
          order: 'asc'
        }
      }
    }
  });

  if (!test) {
    notFound();
  }

  // Check if student has already completed it
  const attempt = await prisma.testAttempt.findUnique({
    where: {
      testId_studentId: {
        testId: id,
        studentId: session.user.id
      }
    }
  });

  return (
    <QuizEngine 
      test={test} 
      initialAttempt={attempt} 
    />
  );
}
