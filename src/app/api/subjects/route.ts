import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { subjectSchema } from '@/lib/validators';
import { slugify } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  const where: any = {};
  if (studentId) {
    where.OR = [
      { studentId: studentId },
      { studentId: null }
    ];
  }

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      chapters: true,
      teacher: { select: { name: true, email: true } },
      student: { select: { id: true, name: true, email: true } }
    }
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
    const { studentId, ...rest } = body.data;
    const subject = await prisma.subject.create({
      data: {
        ...rest,
        studentId: studentId && studentId.trim() !== '' ? studentId : null,
        slug: slugify(rest.name) + (studentId ? `-${studentId.slice(-4)}` : ''),
        teacherId: teacher.id
      },
      include: {
        chapters: true,
        student: { select: { id: true, name: true, email: true } }
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