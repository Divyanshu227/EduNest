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
      { assignedStudentIds: { has: studentId } },
      {
        AND: [
          { studentId: null },
          { assignedStudentIds: { isEmpty: true } }
        ]
      }
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
    const { studentId, assignedStudentIds, ...rest } = body.data;
    
    // Resolve final student assignment
    const finalStudentIds = assignedStudentIds && assignedStudentIds.length > 0 
      ? assignedStudentIds 
      : (studentId && studentId.trim() !== '' ? [studentId] : []);
    
    const primaryStudentId = finalStudentIds.length === 1 ? finalStudentIds[0] : (finalStudentIds.length > 0 ? finalStudentIds[0] : null);

    const subject = await prisma.subject.create({
      data: {
        ...rest,
        studentId: primaryStudentId,
        slug: slugify(rest.name) + (primaryStudentId ? `-${primaryStudentId.slice(-4)}` : `-${Date.now().toString().slice(-4)}`),
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