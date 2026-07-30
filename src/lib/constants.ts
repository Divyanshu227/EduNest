import type { UserRole } from '@prisma/client';

export const APP_NAME = 'EduNest';

export const NAVIGATION = {
  admin: [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Subjects', href: '/admin/subjects' },
    { label: 'Chapters', href: '/admin/chapters' },
    { label: 'Notes', href: '/admin/notes' },
    { label: 'Homework', href: '/admin/homework' },
    { label: 'Tests', href: '/admin/tests' },
    { label: 'Attendance', href: '/admin/attendance' },
    { label: 'Announcements', href: '/admin/announcements' },
    { label: 'Student Progress', href: '/admin/progress' },
    { label: 'Profile', href: '/admin/profile' },
    { label: 'Settings', href: '/admin/settings' }
  ],
  student: [
    { label: 'Dashboard', href: '/student' },
    { label: 'My Notes', href: '/student/notes' },
    { label: 'Homework', href: '/student/homework' },
    { label: 'Tests', href: '/student/tests' },
    { label: 'Attendance', href: '/student/attendance' },
    { label: 'Announcements', href: '/student/announcements' },
    { label: 'Profile', href: '/student/profile' }
  ]
} as const;

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  STUDENT: '/student'
};

export const SUBJECT_ORDER = ['Mathematics', 'English', 'Hindi', 'EVS'] as const;

export const ACCESS_MATRIX = {
  ADMIN: {
    Mathematics: true,
    English: true,
    Hindi: true,
    EVS: true
  },
  STUDENT: {
    Mathematics: true,
    English: true,
    Hindi: true,
    EVS: true
  }
} as const;