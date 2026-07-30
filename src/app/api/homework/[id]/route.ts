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
    const body = await request.json();
    const updated = await prisma.homework.update({
      where: { id },
      data: {
        title: body.title,
        instructions: body.instructions,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        subjectId: body.subjectId,
        chapterId: body.chapterId || null,
        attachments: body.attachments
      }
    });

    return NextResponse.json({ data: updated });
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
    // Delete all child submissions first
    await prisma.homeworkSubmission.deleteMany({
      where: { homeworkId: id }
    });

    // Delete related notifications
    await prisma.notification.deleteMany({
      where: { link: { contains: id } }
    });

    // Delete the homework itself
    await prisma.homework.delete({
      where: { id }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
