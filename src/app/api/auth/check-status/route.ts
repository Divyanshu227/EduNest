import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        passwordHash: true,
        isAccessRevoked: true,
        role: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isAccessRevoked) {
      return NextResponse.json({ isAccessRevoked: true, message: 'Access revoked' }, { status: 403 });
    }

    return NextResponse.json({ isAccessRevoked: false });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
