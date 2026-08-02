import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    // Verify authentication and admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Optional: verify the class was scheduled by this teacher
    const liveClass = await prisma.liveClass.findUnique({ where: { id } });
    if (!liveClass || liveClass.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized or not found' }, { status: 403 });
    }

    // Delete related notifications
    await prisma.notification.deleteMany({ where: { link: { contains: id } } });

    await prisma.liveClass.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Live class cancelled successfully' });
  } catch (error) {
    console.error('Failed to cancel live class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { startTime, durationMin } = body;

    const liveClass = await prisma.liveClass.findUnique({ where: { id } });
    if (!liveClass || liveClass.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized or not found' }, { status: 403 });
    }

    const updatedClass = await prisma.liveClass.update({
      where: { id },
      data: {
        startTime: startTime ? new Date(startTime) : undefined,
        durationMin: durationMin ? parseInt(durationMin) : undefined,
      },
      include: {
        student: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ message: 'Class updated successfully', data: updatedClass });
  } catch (error) {
    console.error('Failed to update live class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
