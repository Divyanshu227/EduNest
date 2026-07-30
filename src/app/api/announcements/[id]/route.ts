import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  try {
    await prisma.announcement.delete({
      where: { id }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
