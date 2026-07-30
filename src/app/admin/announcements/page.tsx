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

  const normalizedAttachments = (attachments: unknown) => {
    if (!Array.isArray(attachments)) return undefined;

    return attachments
      .filter((attachment): attachment is { url: string; name: string; type: string } => {
        return Boolean(
          attachment &&
          typeof attachment === 'object' &&
          'url' in attachment &&
          'name' in attachment &&
          'type' in attachment
        );
      })
      .map((attachment) => ({
        url: attachment.url,
        name: attachment.name,
        type: attachment.type
      }));
  };

  const initialAnnouncements = announcements.map((announcement) => ({
    ...announcement,
    attachments: normalizedAttachments(announcement.attachments)
  }));

  return (
    <AdminAnnouncementsClient 
      initialAnnouncements={initialAnnouncements}
      users={users}
    />
  );
}
