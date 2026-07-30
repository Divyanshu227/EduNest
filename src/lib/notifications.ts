import type { NotificationType, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendPushToTokens } from '@/lib/fcm';

type NotificationPayload = {
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
};

function uniqueTokens(users: Pick<User, 'deviceTokens'>[]) {
  return [...new Set(users.flatMap((user) => user.deviceTokens).filter(Boolean))];
}

export async function notifyUsers(
  users: Pick<User, 'id' | 'deviceTokens'>[],
  payload: NotificationPayload
) {
  if (!users.length) {
    return;
  }

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      link: payload.link ?? null
    }))
  });

  const tokens = uniqueTokens(users);
  await sendPushToTokens(tokens, payload);
}

export async function getStudentRecipients(audience?: string) {
  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      ...(audience && audience !== 'all' && audience !== 'all_students' ? { id: audience } : {})
    },
    select: {
      id: true,
      deviceTokens: true
    }
  });

  return students;
}
