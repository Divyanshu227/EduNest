import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <DashboardShell role="ADMIN" name={session.user.name ?? 'Teacher'} avatarUrl={session.user.avatarUrl}>
      {children}
    </DashboardShell>
  );
}
