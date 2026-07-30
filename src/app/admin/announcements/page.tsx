import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminAnnouncementsClient } from './AdminAnnouncementsClient';

export default async function AdminAnnouncementsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get announcements created by this teacher
  const announcements = await prisma.announcement.findMany({
    where: {
      authorId: session.user.id
    },
    include: {
      author: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Fetch all users so teachers can target specific people
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });

  return (
    <AdminAnnouncementsClient 
      initialAnnouncements={announcements}
      users={users}
    />
  );
}
