import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser, jsonError } from '@/lib/api';
import { homeworkSchema } from '@/lib/validators';

export async function GET() {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  const homework = await prisma.homework.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subject: true, chapter: true, submissions: true }
  });

  return NextResponse.json({ data: homework });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const parsed = homeworkSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError(parsed.error.message, 422);
  }

  const homework = await prisma.homework.create({
    data: {
      ...parsed.data,
      authorId: auth.session.user.id,
      dueDate: new Date(parsed.data.dueDate)
    }
  });

  return NextResponse.json({ data: homework }, { status: 201 });
}