import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { whatsappService } from '@/lib/whatsappService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batch_id = searchParams.get('batch_id');
    const trainer_id = searchParams.get('trainer_id');

    let sessions = DB.getSessions();
    if (batch_id) sessions = sessions.filter((s) => s.batch_id === batch_id);
    if (trainer_id) sessions = sessions.filter((s) => s.trainer_id === trainer_id);

    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.batch_id || !body.trainer_id || !body.hours_taken) {
      return NextResponse.json({ error: 'Batch, Trainer, and Hours are required' }, { status: 400 });
    }

    const batch = DB.getBatchById(body.batch_id);
    const trainer = DB.getUserById(body.trainer_id);

    const rawAttendance = body.students_attendance || [];
    const presentCount = rawAttendance.filter((s: any) => s.status === 'present').length;
    const absentCount = rawAttendance.filter((s: any) => s.status === 'absent').length;
    const leaveCount = rawAttendance.filter((s: any) => s.status === 'leave').length;

    const session = DB.createSession({
      batch_id: body.batch_id,
      batch_name: batch?.name || 'Batch',
      trainer_id: body.trainer_id,
      trainer_name: trainer?.name || 'Trainer',
      course_id: body.course_id || batch?.course_id,
      course_name: body.course_name || batch?.course_name,
      module_name: body.module_name,
      selected_topics: body.selected_topics || [],
      session_date: body.session_date || new Date().toISOString().split('T')[0],
      hours_taken: Number(body.hours_taken),
      description: body.description || '',
      students_attendance: rawAttendance,
      total_students_present: presentCount,
      total_students_absent: absentCount,
      total_students_leave: leaveCount,
    });

    let whatsappResult = null;
    if (batch && body.whatsapp_sent !== false) {
      whatsappResult = await whatsappService.sendSessionUpdate({
        batch,
        session,
        trainer: trainer || null,
      });
    }

    return NextResponse.json({
      success: true,
      session,
      whatsapp: whatsappResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
