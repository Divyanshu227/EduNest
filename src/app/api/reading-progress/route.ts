import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, jsonError } from '@/lib/api';

export async function POST(request: Request) {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  try {
    const { noteId, assetType, page } = await request.json();

    if (!noteId || !assetType || page === undefined) {
      return jsonError('Missing parameters', 400);
    }

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_noteId_assetType: {
          userId: session.session.user.id,
          noteId,
          assetType
        }
      },
      update: {
        page: Number(page)
      },
      create: {
        userId: session.session.user.id,
        noteId,
        assetType,
        page: Number(page)
      }
    });

    return NextResponse.json({ data: progress });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
