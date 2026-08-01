import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ParentProvider } from './ParentContext';
import { StudentSwitcher } from './StudentSwitcher';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'PARENT') {
    redirect('/login');
  }

  // Fetch parent and their linked students
  const parentData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
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
    }
  });

  if (!parentData) {
    redirect('/login');
  }

  const linkedStudents = parentData.parentOf.map(p => p.student);

  return (
    <ParentProvider linkedStudents={linkedStudents}>
      <DashboardShell
        role="PARENT"
        name={parentData.name}
        avatarUrl={parentData.avatarUrl}
      >
        {linkedStudents.length > 1 && (
          <div className="mb-6">
            <StudentSwitcher />
          </div>
        )}
        {children}
      </DashboardShell>
    </ParentProvider>
  );
}
