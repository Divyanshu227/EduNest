import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function StudentLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'STUDENT') {
    redirect('/login');
  }

  return <DashboardShell role="STUDENT" name={session.user.name ?? 'Student'}>{children}</DashboardShell>;
}