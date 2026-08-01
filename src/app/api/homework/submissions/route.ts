import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireRole, jsonError } from '@/lib/api';

export async function POST(request: Request) {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  try {
    const { homeworkId, textAnswer, attachments, studentId } = await request.json();

    if (!homeworkId) {
      return jsonError('homeworkId is required', 400);
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId }
    });

    if (!homework) {
      return jsonError('Homework not found', 404);
    }

    let submittingStudentId = session.session.user.id;
    if (studentId && session.session.user.role === 'PARENT') {
      const link = await prisma.parentStudent.findUnique({
        where: { parentId_studentId: { studentId, parentId: session.session.user.id } }
      });
      if (!link) {
        return jsonError('Not authorized to submit for this student', 403);
      }
      submittingStudentId = studentId;
    }

    // Determine status (LATE if current date is past homework's dueDate)
    const isLate = new Date() > new Date(homework.dueDate);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId: submittingStudentId
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
        studentId: submittingStudentId,
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
        score: score === null ? null : (score !== undefined ? Number(score) : undefined)
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
