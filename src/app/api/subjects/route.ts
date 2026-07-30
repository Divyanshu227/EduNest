import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { subjectSchema } from '@/lib/validators';
import { slugify } from '@/lib/utils';

export async function GET() {
  const subjects = await prisma.subject.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { chapters: true, teacher: { select: { name: true, email: true } } }
  });

  return NextResponse.json({ data: subjects });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const body = subjectSchema.safeParse(await request.json());

  if (!body.success) {
    return jsonError(body.error.message, 422);
  }

  const teacher = await prisma.user.findUnique({ where: { id: auth.session.user.id } });

  if (!teacher) {
    return jsonError('Teacher account not found', 404);
  }

  try {
    const subject = await prisma.subject.create({
      data: {
        ...body.data,
        slug: slugify(body.data.name),
        teacherId: teacher.id
      }
    });

    return NextResponse.json({ data: subject }, { status: 201 });
  } catch (error: any) {
    console.error("Subject creation error:", error);
    if (error.code === 'P2002') {
      return jsonError('A subject with this name already exists.', 409);
    }
    return jsonError('Internal Server Error', 500);
  }
}