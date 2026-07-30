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

    await prisma.liveClass.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Live class cancelled successfully' });
  } catch (error) {
    console.error('Failed to cancel live class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
