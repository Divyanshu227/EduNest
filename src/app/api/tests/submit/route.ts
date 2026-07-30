import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, jsonError } from '@/lib/api';

export async function POST(request: Request) {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  try {
    const { testId, answers } = await request.json();

    if (!testId || !answers) {
      return jsonError('Missing parameters', 400);
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true }
    });

    if (!test) {
      return jsonError('Test not found', 404);
    }

    let score = 0;
    let maxMarks = 0;

    const evaluatedAnswers: Record<string, { studentAnswer: string; isCorrect: boolean; correctAnswer: string | null }> = {};

    test.questions.forEach((q) => {
      const studentAnswer = (answers[q.id] || '').trim();
      const correctAnswer = q.correctAnswer || '';
      
      let isCorrect = false;
      if (q.type === 'MCQ') {
        isCorrect = studentAnswer === correctAnswer;
      } else {
        // Short Answer: case-insensitive and trimmed comparison
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
      }

      if (isCorrect) {
        score += q.marks;
      }
      maxMarks += q.marks;

      evaluatedAnswers[q.id] = {
        studentAnswer,
        isCorrect,
        correctAnswer: q.correctAnswer
      };
    });

    const percentage = maxMarks > 0 ? (score / maxMarks) * 100 : 0;

    const attempt = await prisma.testAttempt.upsert({
      where: {
        testId_studentId: {
          testId,
          studentId: session.session.user.id
        }
      },
      update: {
        answers,
        score,
        percentage,
        completedAt: new Date()
      },
      create: {
        testId,
        studentId: session.session.user.id,
        answers,
        score,
        percentage
      }
    });

    return NextResponse.json({ 
      data: {
        attempt,
        score,
        maxMarks,
        percentage,
        evaluatedAnswers
      }
    }, { status: 201 });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
