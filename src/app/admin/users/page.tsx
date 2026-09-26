import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminUsersClient } from './AdminUsersClient';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN' || session.user.isAccessRevoked) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Fetch all users to display in the management dashboard
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isAccessRevoked: true,
      createdAt: true,
      parents: {
        include: {
          parent: {
            select: { name: true, phone: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return <AdminUsersClient initialUsers={users} currentUserId={session.user.id} />;
}
