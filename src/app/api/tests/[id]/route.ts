import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  try {
    const { title, description, subjectId, chapterId, durationMin, isPublished, questions } = await request.json();

    // 1. Update Test Info
    const updatedTest = await prisma.test.update({
      where: { id },
      data: {
        title,
        description,
        subjectId,
        chapterId: chapterId || null,
        durationMin: Number(durationMin),
        isPublished: Boolean(isPublished),
        startsAt: isPublished ? new Date() : null
      }
    });

    // 2. If questions are provided, update them by deleting existing ones and creating new ones
    if (Array.isArray(questions)) {
      await prisma.question.deleteMany({
        where: { testId: id }
      });

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await prisma.question.create({
          data: {
            testId: id,
            type: q.type,
            prompt: q.prompt,
            options: q.options || null,
            correctAnswer: q.correctAnswer || '',
            marks: Number(q.marks || 1),
            explanation: q.explanation || '',
            order: i + 1
          }
        });
      }
    }

    // Return the updated test including questions
    const finalTest = await prisma.test.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } }
    });

    return NextResponse.json({ data: finalTest });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  try {
    // Delete child items
    await prisma.question.deleteMany({ where: { testId: id } });
    await prisma.testAttempt.deleteMany({ where: { testId: id } });
    
    // Delete related notifications
    await prisma.notification.deleteMany({ where: { link: { contains: id } } });
    
    // Delete test
    await prisma.test.delete({ where: { id } });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
