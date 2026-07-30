import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { noteMetadataSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subjectId = url.searchParams.get('subjectId');
  const chapterId = url.searchParams.get('chapterId');
  const q = url.searchParams.get('q');

  const data = await prisma.note.findMany({
    where: {
      ...(subjectId ? { subjectId } : {}),
      ...(chapterId ? { chapterId } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {})
    },
    orderBy: { lastUpdated: 'desc' },
    include: { subject: true, chapter: true }
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const parsed = noteMetadataSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError(parsed.error.message, 422);
  }

  const note = await prisma.note.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      subjectId: parsed.data.subjectId,
      chapterId: parsed.data.chapterId,
      youtubeUrl: parsed.data.youtubeUrl || null,
      type: parsed.data.noteType,
      images: [],
      pdfs: [],
      pageCount: 0,
      lastUpdated: new Date()
    }
  });

  return NextResponse.json({ data: note }, { status: 201 });
}