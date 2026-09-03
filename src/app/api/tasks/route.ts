import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { whatsappService } from '@/lib/whatsappService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trainer_id = searchParams.get('trainer_id');
    const tasks = DB.getTaskLogs(trainer_id || undefined);
    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, taskId, trainer_id, title, category, notes } = body;

    if (action === 'start') {
      if (!trainer_id || !title) {
        return NextResponse.json({ error: 'Trainer ID and Title are required' }, { status: 400 });
      }
      const trainer = DB.getUserById(trainer_id);
      const newTask = DB.startTask({
        trainer_id,
        trainer_name: trainer?.name || 'Trainer',
        title,
        category: category || 'doubt_solving',
        notes,
      });

      // Automated WhatsApp Broadcast to LEARNMORE-Login-Logout group
      await whatsappService.sendTaskUpdate({
        trainerName: trainer?.name || 'Trainer',
        title,
        action: 'started',
        category,
        notes,
      });

      return NextResponse.json({ success: true, task: newTask });
    }

    if (action === 'complete') {
      if (!taskId) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
      }
      const completed = DB.completeTask(taskId);
      if (!completed) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      // Automated WhatsApp Broadcast to LEARNMORE-Login-Logout group
      await whatsappService.sendTaskUpdate({
        trainerName: completed.trainer_name || 'Trainer',
        title: completed.title,
        action: 'completed',
        category: completed.category,
        durationMinutes: completed.duration_minutes,
        notes: completed.notes,
      });

      return NextResponse.json({ success: true, task: completed });
    }

    return NextResponse.json({ error: 'Invalid action (start or complete)' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
