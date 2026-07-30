import type { NotificationType, User, UserRole } from '@prisma/client';
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
  let targetId = audience;
  let targetRole = 'STUDENT';

  if (audience === 'all_teachers') {
    targetRole = 'ADMIN';
  } else if (audience && audience.startsWith('teacher:')) {
    targetId = audience.split(':')[1];
    targetRole = 'ADMIN';
  } else if (audience && audience.startsWith('student:')) {
    targetId = audience.split(':')[1];
    targetRole = 'STUDENT';
  }

  const recipients = await prisma.user.findMany({
    where: {
      role: targetRole as UserRole,
      ...(targetId && targetId !== 'all' && targetId !== 'all_students' && targetId !== 'all_teachers' ? { id: targetId } : {})
    },
    select: {
      id: true,
      deviceTokens: true
    }
  });

  return recipients;
}
