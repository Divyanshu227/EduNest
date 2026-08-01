import type { UserRole } from '@prisma/client';

export const APP_NAME = 'EduNest';

export const NAVIGATION = {
  admin: [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Classes', href: '/admin/classes' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Parents', href: '/admin/parents' },
    { label: 'Subjects', href: '/admin/subjects' },
    { label: 'Notes', href: '/admin/notes' },
    { label: 'Homework', href: '/admin/homework' },
    { label: 'Attendance', href: '/admin/attendance' },
    { label: 'Announcements', href: '/admin/announcements' },
    { label: 'Profile', href: '/admin/profile' },
    { label: 'Settings', href: '/admin/settings' }
  ],
  student: [
    { label: 'Dashboard', href: '/student' },
    { label: 'Classes', href: '/student/classes' },
    { label: 'Subjects', href: '/student/subjects' },
    { label: 'Notes', href: '/student/notes' },
    { label: 'Homework', href: '/student/homework' },
    { label: 'Attendance', href: '/student/attendance' },
    { label: 'Announcements', href: '/student/announcements' },
    { label: 'Profile', href: '/student/profile' }
  ],
  parent: [
    { label: 'Dashboard', href: '/parent' },
    { label: 'Schedule', href: '/parent/schedule' },
    { label: 'Homework', href: '/parent/homework' },
    { label: 'Notes', href: '/parent/notes' },
    { label: 'Tests', href: '/parent/tests' },
    { label: 'Attendance', href: '/parent/attendance' },
    { label: 'Announcements', href: '/parent/announcements' },
    { label: 'Profile', href: '/parent/profile' }
  ]
} as const;

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  STUDENT: '/student',
  PARENT: '/parent'
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
  },
  PARENT: {
    Mathematics: true,
    English: true,
    Hindi: true,
    EVS: true
  }
} as const;