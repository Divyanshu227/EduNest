import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminClassesClient } from './AdminClassesClient';
export const metadata = {
  title: 'Manage Live Classes | EduNest Admin',
  description: 'Schedule and manage live classes for students',
};

export default async function AdminClassesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch all students to schedule classes with
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  // Fetch all scheduled classes
  const classes = await prisma.liveClass.findMany({
    where: { teacherId: session.user.id },
    include: {
      student: { select: { name: true, email: true } }
    },
    orderBy: { startTime: 'asc' },
  });

  return (
    <AdminClassesClient initialClasses={classes} students={students} />
  );
}
