import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { testSchema } from '@/lib/validators';

export async function GET() {
  const data = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subject: true, chapter: true, questions: true }
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const parsed = testSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError(parsed.error.message, 422);
  }

  const test = await prisma.test.create({
    data: {
      ...parsed.data,
      authorId: auth.session.user.id,
      startsAt: parsed.data.isPublished ? new Date() : null,
      endsAt: null
    }
  });

  return NextResponse.json({ data: test }, { status: 201 });
}