import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser, jsonError } from '@/lib/api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  const note = await prisma.note.findUnique({
    where: { id },
    include: { subject: true, chapter: true }
  });

  if (!note) {
    return jsonError('Note not found', 404);
  }

  return NextResponse.json({ data: { note, progress: null } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        youtubeUrl: body.youtubeUrl || null,
        images: body.images !== undefined ? body.images : undefined,
        pdfs: body.pdfs !== undefined ? body.pdfs : undefined,
        pageCount: body.pageCount !== undefined ? body.pageCount : undefined,
        type: body.type,
        assignedStudentIds: body.assignedStudentIds !== undefined ? body.assignedStudentIds : undefined,
        lastUpdated: new Date()
      }
    });

    return NextResponse.json({ data: updatedNote });
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
    // Delete related notifications
    await prisma.notification.deleteMany({ where: { link: { contains: id } } });

    await prisma.note.delete({
      where: { id }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
