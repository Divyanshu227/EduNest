import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { StudentClassesClient } from './StudentClassesClient';

export const metadata = {
  title: 'My Live Classes | EduNest',
  description: 'Join your scheduled live classes',
};

export default async function StudentClassesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'STUDENT') {
    redirect('/login');
  }

  // Fetch all scheduled classes for this student
  const classes = await prisma.liveClass.findMany({
    where: { studentId: session.user.id },
    include: {
      teacher: { select: { name: true, email: true } }
    },
    orderBy: { startTime: 'asc' },
  });

  return (
    <StudentClassesClient initialClasses={classes} />
  );
}
