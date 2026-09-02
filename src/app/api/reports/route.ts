import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = Number(searchParams.get('month')) || now.getMonth() + 1;
    const year = Number(searchParams.get('year')) || now.getFullYear();

    const report = DB.getIncentiveReport(month, year);
    return NextResponse.json({ success: true, report, month, year });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
