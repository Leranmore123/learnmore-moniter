import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { whatsappService } from '@/lib/whatsappService';

export async function GET() {
  try {
    const activities = DB.getLiveActivities();
    const users = DB.getUsers().filter((u) => u.role === 'trainer');

    // Combine user details with activity state
    const result = users.map((trainer) => {
      const act = activities[trainer.id] || {
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        status: 'idle',
        current_task_title: 'No active session or task',
        status_started_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
        idle_minutes_current: 0,
        total_idle_today_minutes: 0,
        total_teaching_today_minutes: 0,
        total_task_today_minutes: 0,
        is_logged_in: false,
      };

      return {
        ...trainer,
        activity: act,
      };
    });

    return NextResponse.json({ success: true, activities: result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, trainer_id, status, current_task_title, current_batch_id, current_batch_name } = body;

    if (!trainer_id) {
      return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });
    }

    if (action === 'heartbeat') {
      DB.pingHeartbeat(trainer_id);
      return NextResponse.json({ success: true, message: 'Heartbeat recorded' });
    }

    if (action === 'update_status' && status) {
      const trainer = DB.getUserById(trainer_id);
      const updated = DB.updateTeacherActivity({
        trainer_id,
        trainer_name: trainer?.name || 'Trainer',
        status,
        current_task_title,
        current_batch_id,
        current_batch_name,
      });

      // Automated WhatsApp Broadcast to official group
      try {
        await whatsappService.sendStatusUpdateNotification({
          trainerName: trainer?.name || 'Trainer',
          status,
          currentTaskTitle: current_task_title,
          batchName: current_batch_name,
        });
      } catch {}

      return NextResponse.json({ success: true, activity: updated });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
