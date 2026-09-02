import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { calculateMonthlyWorkingDays } from '@/lib/holidays';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get('year')) || new Date().getFullYear();
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;

    const holidayConfig = DB.getHolidayConfig();
    const monthlySchedule = calculateMonthlyWorkingDays(
      year,
      month,
      holidayConfig.mandatory_holidays,
      holidayConfig.week_off_pattern
    );

    return NextResponse.json({
      success: true,
      holidayConfig,
      monthlySchedule: {
        year,
        month,
        ...monthlySchedule,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = DB.updateHolidayConfig(body);
    return NextResponse.json({
      success: true,
      message: 'Holiday & Week-Off configuration updated successfully.',
      holidayConfig: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
