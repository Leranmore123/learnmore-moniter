import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;

    const snapshot = DB.getTrainerMonitoringSnapshot(date);
    return NextResponse.json({ success: true, ...snapshot });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
