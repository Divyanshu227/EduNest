import { NextRequest, NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/reminder-scheduler';

export async function GET(request: NextRequest) {
  try {
    const result = await processDueReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cron error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await processDueReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cron error' }, { status: 500 });
  }
}
