import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminAttendanceClient } from './AdminAttendanceClient';

export default async function AdminAttendancePage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects managed by this teacher
  const subjects = await prisma.subject.findMany({
    where: { teacherId: session.user.id },
    orderBy: { sortOrder: 'asc' }
  });

  // Get students list
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true }
  });

  // Get recent attendance logs
  const logs = await prisma.attendance.findMany({
    where: {
      subjectId: {
        in: subjects.map((s) => s.id)
      }
    },
    include: {
      student: { select: { name: true, email: true } },
      subject: true
    },
    orderBy: {
      date: 'desc'
    },
    take: 20
  });

  return (
    <AdminAttendanceClient 
      subjects={subjects} 
      students={students} 
      initialLogs={logs} 
    />
  );
}
