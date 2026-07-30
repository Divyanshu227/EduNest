import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    return { error: jsonError('Unauthorized', 401) };
  }

  return { session };
}

export async function requireRole(roles: UserRole[]) {
  const result = await requireUser();

  if ('error' in result) {
    return result;
  }

  if (!roles.includes(result.session.user.role)) {
    return { error: jsonError('Forbidden', 403) };
  }

  return result;
}

export function parseJsonRequest<T>(value: unknown): T {
  return value as T;
}