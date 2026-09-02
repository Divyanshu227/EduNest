import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api';
import { 
  sendClassReminder, 
  sendHomeworkReminder, 
  processDueReminders 
} from '@/lib/reminder-scheduler';

export async function GET(request: NextRequest) {
  const auth = await requireRole(['ADMIN']);
  if ('error' in auth) {
    return auth.error;
  }

  const targetId = request.nextUrl.searchParams.get('targetId');
  const type = request.nextUrl.searchParams.get('type');

  try {
    const where: any = {};
    if (targetId) where.targetId = targetId;
    if (type) where.type = type;

    const reminders = await (prisma as any).scheduledReminder.findMany({
      where,
      orderBy: { scheduledFor: 'asc' }
    });

    return NextResponse.json({ data: reminders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(['ADMIN']);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const { type, targetId, studentId, scheduledFor, customMessage, isImmediate } = body;

    if (!type || !targetId) {
      return NextResponse.json({ error: 'type and targetId are required' }, { status: 400 });
    }

    if (isImmediate) {
      // Send immediately
      if (type === 'CLASS') {
        const result = await sendClassReminder({ classId: targetId, customMessage });
        return NextResponse.json({ 
          success: true, 
          message: `Immediate reminder sent to ${result.studentName}${result.parentCount > 0 ? ` & ${result.parentCount} parent(s)` : ''}.` 
        });
      } else if (type === 'HOMEWORK') {
        const result = await sendHomeworkReminder({ homeworkId: targetId, studentId, customMessage });
        return NextResponse.json({ 
          success: true, 
          message: `Immediate reminder sent to ${result.studentCount} student(s) & ${result.parentCount} parent(s).` 
        });
      }
    }

    // Schedule for future
    if (!scheduledFor) {
      return NextResponse.json({ error: 'scheduledFor date/time is required' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 });
    }

    // If scheduled time is in past or within 30 seconds, send immediately
    if (scheduledDate.getTime() <= Date.now() + 30000) {
      if (type === 'CLASS') {
        const result = await sendClassReminder({ classId: targetId, customMessage });
        return NextResponse.json({ 
          success: true, 
          message: `Reminder sent to ${result.studentName}${result.parentCount > 0 ? ` & ${result.parentCount} parent(s)` : ''}.` 
        });
      } else {
        const result = await sendHomeworkReminder({ homeworkId: targetId, studentId, customMessage });
        return NextResponse.json({ 
          success: true, 
          message: `Reminder sent to ${result.studentCount} student(s) & ${result.parentCount} parent(s).` 
        });
      }
    }

    const newReminder = await (prisma as any).scheduledReminder.create({
      data: {
        type,
        targetId,
        studentId: studentId || null,
        scheduledFor: scheduledDate,
        body: customMessage || null,
        status: 'PENDING',
        createdBy: auth.session.user.id
      }
    });

    const timeFormatted = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    }).format(scheduledDate);

    return NextResponse.json({
      success: true,
      data: newReminder,
      message: `Reminder scheduled successfully for ${timeFormatted}.`
    });
  } catch (error: any) {
    console.error('Failed to schedule reminder:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(['ADMIN']);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    const { reminderId } = await request.json();
    if (!reminderId) {
      return NextResponse.json({ error: 'reminderId is required' }, { status: 400 });
    }

    await (prisma as any).scheduledReminder.update({
      where: { id: reminderId },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ success: true, message: 'Scheduled reminder cancelled.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
