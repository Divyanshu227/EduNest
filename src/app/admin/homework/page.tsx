import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdminHomeworkClient } from './AdminHomeworkClient';

export default async function AdminHomeworkPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects managed by this teacher
  const subjects = await prisma.subject.findMany({
    where: { teacherId: session.user.id },
    orderBy: { sortOrder: 'asc' },
    include: { chapters: { orderBy: { order: 'asc' } } }
  });

  // Get homework assignments along with student submissions
  const homeworkList = await prisma.homework.findMany({
    where: {
      subjectId: {
        in: subjects.map((s) => s.id)
      }
    },
    include: {
      subject: true,
      chapter: true,
      submissions: {
        include: {
          student: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      dueDate: 'desc'
    }
  });

  // Fetch all students to see who hasn't submitted yet
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true }
  });

  return (
    <AdminHomeworkClient 
      initialHomework={homeworkList} 
      subjects={subjects}
      students={students}
    />
  );
}
