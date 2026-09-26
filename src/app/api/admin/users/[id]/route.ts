import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const MASTER_ADMIN_EMAIL = 'admin@edunest.dev';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    // Verify authentication and role
    if (!session?.user || session.user.role !== 'ADMIN' || session.user.isAccessRevoked) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role, avatarUrl, phone, isAccessRevoked } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;

    // Hash the new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Allow admin to set avatar for any user
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    if (isAccessRevoked !== undefined) {
      if (targetUser.email === MASTER_ADMIN_EMAIL && isAccessRevoked === true) {
        return NextResponse.json({ error: 'Cannot revoke access of Master Admin' }, { status: 403 });
      }
      if (id === session.user.id && isAccessRevoked === true) {
        return NextResponse.json({ error: 'Cannot revoke your own access' }, { status: 403 });
      }
      updateData.isAccessRevoked = Boolean(isAccessRevoked);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        phone: updatedUser.phone,
        isAccessRevoked: updatedUser.isAccessRevoked,
      },
    });

  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN' || session.user.isAccessRevoked) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent deleting the currently logged-in admin
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    // Protect master admin from being deleted by anyone
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.email === MASTER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'The Master Admin account cannot be removed' }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
