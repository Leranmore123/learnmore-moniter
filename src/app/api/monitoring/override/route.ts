import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trainer_id, date, day_status, mark_in_time, mark_out_time, topic_covered, location_name } = body;

    if (!trainer_id) {
      return NextResponse.json({ error: 'trainer_id is required' }, { status: 400 });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const success = DB.adminOverrideTrainerDay({
      trainer_id,
      date: targetDate,
      day_status,
      mark_in_time,
      mark_out_time,
      topic_covered,
      location_name,
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to apply override' }, { status: 400 });
    }

    const updatedSnapshot = DB.getTrainerMonitoringSnapshot(targetDate);
    return NextResponse.json({
      success: true,
      message: 'Trainer details updated successfully!',
      snapshot: updatedSnapshot,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
