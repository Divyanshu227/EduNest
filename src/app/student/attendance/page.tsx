import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { StudentAttendanceClient } from './StudentAttendanceClient';

export default async function StudentAttendancePage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get all attendance logs for this student
  const logs = await prisma.attendance.findMany({
    where: {
      studentId: session.user.id
    },
    include: {
      subject: true,
      markedBy: { select: { name: true } }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Get subjects metadata
  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { studentId: session.user.id },
        { assignedStudentIds: { has: session.user.id } },
        {
          AND: [
            { studentId: null },
            { assignedStudentIds: { isEmpty: true } }
          ]
        }
      ]
    },
    orderBy: { sortOrder: 'asc' }
  });

  return (
    <StudentAttendanceClient 
      logs={logs} 
      subjects={subjects} 
    />
  );
}
