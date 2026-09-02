import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { whatsappService } from '@/lib/whatsappService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trainer_id = searchParams.get('trainer_id');

    let leaves = DB.getLeaves();
    if (trainer_id) {
      leaves = leaves.filter((l) => l.trainer_id === trainer_id);
    }
    return NextResponse.json({ success: true, leaves });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.trainer_id || !body.leave_type || !body.start_date || !body.end_date || !body.reason) {
      return NextResponse.json({ error: 'All leave fields are required' }, { status: 400 });
    }

    const trainer = DB.getUserById(body.trainer_id);
    const res = DB.applyLeave({
      trainer_id: body.trainer_id,
      trainer_name: trainer?.name || 'Trainer',
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    // 1. Automatically dispatch Leave/Weekoff Announcement to WhatsApp Attendance Group (LEARNMORE-Login-Logout)
    try {
      await whatsappService.sendLeaveNotification({
        trainerName: trainer?.name || 'Trainer',
        phone: trainer?.phone,
        leaveType: body.leave_type,
        startDate: body.start_date,
        endDate: body.end_date,
        reason: body.reason,
        status: 'Registered / Submitted',
      });
    } catch {
      // silent
    }

    // 2. Automatically dispatch Weekoff/Leave Notice to all Student Batch Groups of this trainer
    if (trainer) {
      try {
        await whatsappService.sendWeekoffOrLeaveToBatchGroups({
          trainer,
          leaveType: body.leave_type,
          startDate: body.start_date,
          endDate: body.end_date,
          reason: body.reason,
        });
      } catch {
        // silent
      }
    }

    return NextResponse.json({ success: true, leave: res.leave, message: res.message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, admin_notes } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }

    const updated = DB.updateLeaveStatus(id, status, admin_notes);
    if (!updated) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, leave: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
