import type { UserRole } from '@prisma/client';

export function canManageSubject(role: UserRole, subjectName: string, teacherSubjectName?: string | null) {
  if (role !== 'ADMIN') {
    return false;
  }

  if (!teacherSubjectName) {
    return true;
  }

  return teacherSubjectName === subjectName;
}

export function canAccessAdminRoute(role: UserRole | undefined, href: string) {
  if (!role) {
    return false;
  }

  if (role === 'ADMIN') {
    return href.startsWith('/admin');
  }

  return href.startsWith('/student');
}