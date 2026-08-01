import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { parentId, studentId } = await req.json();
    if (!parentId || !studentId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const link = await prisma.parentStudent.create({
      data: { parentId, studentId }
    });

    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error('Failed to link student:', error);
    return NextResponse.json({ error: 'Internal server error or link already exists' }, { status: 500 });
  }
}
