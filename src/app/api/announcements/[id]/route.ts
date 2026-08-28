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
    const dataToUpdate: any = {};

    if (body.pinned !== undefined) {
      dataToUpdate.pinned = Boolean(body.pinned);
      if (!dataToUpdate.pinned) {
        dataToUpdate.pinUntil = null;
      }
    }

    if (body.pinUntil !== undefined) {
      dataToUpdate.pinUntil = body.pinUntil ? new Date(body.pinUntil) : null;
    }

    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.message !== undefined) dataToUpdate.message = body.message;

    const updated = await prisma.announcement.update({
      where: { id },
      data: dataToUpdate,
      include: { author: { select: { name: true, email: true } } }
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
    // Delete related notifications
    await prisma.notification.deleteMany({ where: { link: { contains: id } } });

    await prisma.announcement.delete({
      where: { id }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
