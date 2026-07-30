import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireRole, jsonError } from '@/lib/api';

export async function POST(request: Request) {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  try {
    const { homeworkId, textAnswer, attachments } = await request.json();

    if (!homeworkId) {
      return jsonError('homeworkId is required', 400);
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId }
    });

    if (!homework) {
      return jsonError('Homework not found', 404);
    }

    // Determine status (LATE if current date is past homework's dueDate)
    const isLate = new Date() > new Date(homework.dueDate);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId: session.session.user.id
        }
      },
      update: {
        textAnswer,
        attachments: attachments || [],
        status,
        submittedAt: new Date()
      },
      create: {
        homeworkId,
        studentId: session.session.user.id,
        textAnswer,
        attachments: attachments || [],
        status
      }
    });

    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  try {
    const { submissionId, feedback, score } = await request.json();

    if (!submissionId) {
      return jsonError('submissionId is required', 400);
    }

    const updated = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        feedback,
        score: score !== undefined ? Number(score) : undefined
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
