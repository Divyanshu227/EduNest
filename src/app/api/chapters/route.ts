import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { chapterSchema } from '@/lib/validators';
import { slugify } from '@/lib/utils';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subjectId = url.searchParams.get('subjectId');

  const chapters = await prisma.chapter.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: { order: 'asc' },
    include: { subject: true }
  });

  return NextResponse.json({ data: chapters });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const body = chapterSchema.safeParse(await request.json());

  if (!body.success) {
    return jsonError(body.error.message, 422);
  }

  const chapter = await prisma.chapter.create({
    data: {
      ...body.data,
      slug: slugify(body.data.name)
    }
  });

  return NextResponse.json({ data: chapter }, { status: 201 });
}