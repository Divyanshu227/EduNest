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

    // Prisma relation onDelete: Cascade will handle deleting associated Notes, Homework, and Tests.
    await prisma.chapter.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Failed to delete chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
