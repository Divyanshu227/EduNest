import { prisma } from '@/lib/prisma';
import { ParentFeedbackClient } from './ParentFeedbackClient';

export default async function ParentFeedbackPage() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true }
  });

  return <ParentFeedbackClient admins={admins} />;
}
