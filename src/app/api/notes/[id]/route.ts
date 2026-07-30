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

  // Get student's reading progress if user is student
  let progress = null;
  if (session.session.user.role === 'STUDENT') {
    progress = await prisma.readingProgress.findMany({
      where: { userId: session.session.user.id, noteId: id }
    });
  }

  return NextResponse.json({ data: { note, progress } });
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
    // Delete related notifications and progress
    await prisma.notification.deleteMany({ where: { link: { contains: id } } });
    await prisma.readingProgress.deleteMany({ where: { noteId: id } });

    await prisma.note.delete({
      where: { id }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
