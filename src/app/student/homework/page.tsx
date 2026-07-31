import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { StudentHomeworkClient } from './StudentHomeworkClient';

export default async function StudentHomeworkPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get homework list along with student's own submission for each
  const homeworkList = await prisma.homework.findMany({
    where: {
      OR: [
        { assignedStudentIds: { has: session.user.id } },
        { assignedStudentIds: { isEmpty: true } }
      ]
    },
    include: {
      subject: true,
      chapter: true,
      submissions: {
        where: {
          studentId: session.user.id
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  return (
    <StudentHomeworkClient 
      homeworkList={homeworkList} 
    />
  );
}
