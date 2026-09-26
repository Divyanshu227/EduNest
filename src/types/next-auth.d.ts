import 'next-auth';
import 'next-auth/jwt';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      avatarUrl?: string | null;
      home: string;
      name?: string | null;
      email?: string | null;
      isAccessRevoked?: boolean;
    };
  }

  interface User {
    role: UserRole;
    avatarUrl?: string | null;
    isAccessRevoked?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    avatarUrl?: string | null;
    isAccessRevoked?: boolean;
  }
}