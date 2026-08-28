import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const dataToUpdate: any = {};

    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.color !== undefined) dataToUpdate.color = body.color;
    if (body.icon !== undefined) dataToUpdate.icon = body.icon;
    if (body.sortOrder !== undefined) dataToUpdate.sortOrder = parseInt(body.sortOrder) || 0;

    // Handle student feed / edit / remove
    if (body.studentId !== undefined) {
      const sId = body.studentId && body.studentId.trim() !== '' ? body.studentId : null;
      dataToUpdate.studentId = sId;
    } else if (body.assignedStudentIds !== undefined) {
      const ids: string[] = Array.isArray(body.assignedStudentIds) ? body.assignedStudentIds : [];
      dataToUpdate.studentId = ids.length > 0 ? ids[0] : null;
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: dataToUpdate,
      include: {
        chapters: true,
        teacher: { select: { name: true, email: true } },
        student: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('Failed to update subject:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    // Verify authentication and admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prisma relation onDelete: Cascade will handle deleting associated Chapters, Notes, Homework, and Tests.
    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Failed to delete subject:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
