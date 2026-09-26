import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { credentialsSchema } from '@/lib/validators';
import { ROLE_HOME } from '@/lib/constants';

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  isAccessRevoked?: boolean;
};

function hasRole(user: unknown): user is { role: UserRole; avatarUrl?: string | null; isAccessRevoked?: boolean } {
  return typeof user === 'object' && user !== null && 'role' in user;
}

function hasAuthenticatedUserShape(
  user: unknown
): user is { id: string; role: UserRole; avatarUrl?: string | null; isAccessRevoked?: boolean } {
  return typeof user === 'object' && user !== null && 'id' in user && 'role' in user;
}

export const authConfig = {
  session: {
    strategy: 'jwt' as const
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }
        });

        if (!user) {
          return null;
        }

        const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!matches) {
          return null;
        }

        if (user.isAccessRevoked) {
          return null;
        }

        const authenticatedUser: AuthenticatedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isAccessRevoked: false
        };

        return authenticatedUser;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (hasAuthenticatedUserShape(user)) {
        token.sub = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl ?? null;
        token.isAccessRevoked = user.isAccessRevoked ?? false;
      } else if (hasRole(user)) {
        token.role = user.role;
        token.avatarUrl = user.avatarUrl ?? null;
        token.isAccessRevoked = user.isAccessRevoked ?? false;
      }

      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { role: true, avatarUrl: true, isAccessRevoked: true }
        });

        if (dbUser) {
          token.isAccessRevoked = dbUser.isAccessRevoked ?? false;
          if (dbUser.isAccessRevoked) {
            token.role = undefined;
          } else {
            token.role = dbUser.role;
            token.avatarUrl = dbUser.avatarUrl;
          }
        } else {
          token.isAccessRevoked = true;
          token.role = undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const isRevoked = Boolean(token.isAccessRevoked);
        session.user.isAccessRevoked = isRevoked;

        if (isRevoked || !token.role) {
          session.user.role = undefined as any;
          session.user.home = '';
        } else {
          const role = (token.role as UserRole | undefined) ?? 'STUDENT';
          session.user.id = token.sub ?? '';
          session.user.role = role;
          session.user.avatarUrl = (token.avatarUrl as string | undefined) ?? null;
          session.user.home = ROLE_HOME[role];
        }
      }

      return session;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
