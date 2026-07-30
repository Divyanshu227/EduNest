import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { getStudentRecipients, notifyUsers } from '@/lib/notifications';
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

  if (parsed.data.isPublished) {
    const recipients = await getStudentRecipients();
    await notifyUsers(recipients, {
      title: `New test: ${parsed.data.title}`,
      body: 'A new test is now available for you to take.',
      type: 'TEST',
      link: '/student/tests'
    });
  }

  return NextResponse.json({ data: test }, { status: 201 });
}
