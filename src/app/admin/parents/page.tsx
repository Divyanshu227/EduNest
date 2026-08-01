import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminParentsClient } from './AdminParentsClient';
import { redirect } from 'next/navigation';

export default async function AdminParentsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return <div className="p-6">Unauthorized</div>;
  }

  const parents = await prisma.user.findMany({
    where: { role: 'PARENT' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      parentOf: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' }
  });

  return <AdminParentsClient initialParents={parents} allStudents={students} />;
}
