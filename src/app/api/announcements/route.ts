import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, jsonError } from '@/lib/api';
import { getStudentRecipients, notifyUsers } from '@/lib/notifications';
import { announcementSchema } from '@/lib/validators';

export async function GET() {
  const data = await prisma.announcement.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: { name: true, email: true } } }
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const parsed = announcementSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError(parsed.error.message, 422);
  }

  const announcement = await prisma.announcement.create({
    data: {
      ...parsed.data,
      authorId: auth.session.user.id
    }
  });

  const recipients = await getStudentRecipients(parsed.data.audience);
  await notifyUsers(recipients, {
    title: parsed.data.title,
    body: parsed.data.message,
    type: 'ANNOUNCEMENT',
    link: '/student/announcements'
  });

  return NextResponse.json({ data: announcement }, { status: 201 });
}
