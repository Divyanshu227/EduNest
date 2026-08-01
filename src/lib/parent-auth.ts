import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function getAuthorizedParentStudent(searchParamsPromise: Promise<{ student?: string }> | { student?: string }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'PARENT') {
    redirect('/login');
  }

  const parentData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { parentOf: true }
  });

  if (!parentData || parentData.parentOf.length === 0) {
    return null; // Parent has no linked students
  }

  const searchParams = await searchParamsPromise;
  const studentId = searchParams.student || parentData.parentOf[0].studentId;
  
  const isOwner = parentData.parentOf.some(link => link.studentId === studentId);
  if (!isOwner) {
    redirect('/parent'); // Unauthorized for this student, send to default
  }

  return studentId;
}
