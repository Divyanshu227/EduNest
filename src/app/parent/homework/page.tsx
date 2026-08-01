import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { ParentHomeworkClient } from './ParentHomeworkClient';

export default async function ParentHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  const homework = await prisma.homework.findMany({
    where: { 
      OR: [
        { assignedStudentIds: { has: studentId } },
        { assignedStudentIds: { isEmpty: true } }
      ]
    },
    orderBy: { dueDate: 'desc' },
    include: {
      subject: true,
      submissions: {
        where: { studentId }
      }
    }
  });

  return <ParentHomeworkClient homeworkList={homework} studentId={studentId} />;
}
