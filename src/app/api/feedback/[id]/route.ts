import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = (await params).id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Verify the admin owns this feedback
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback || feedback.teacherId !== session.user.id) {
       return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 });
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ message: 'Status updated', feedback: updated });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
