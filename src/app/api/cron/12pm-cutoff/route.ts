import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { EmailService } from '@/lib/emailService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const targetEmail = searchParams.get('email') || 'kanzariyapratik124@gmail.com';

    const result = DB.run12pmCutoffCheck(date);

    // If working day and unlogged trainers found, dispatch absence notifications
    if (result.isWorkingDay && result.totalFlagged > 0) {
      for (const trainer of result.unloggedTrainers) {
        await EmailService.send12pmAbsenceEmail({
          to: targetEmail,
          subject: `⚠️ Notice of Uninformed Absence - ${trainer.trainer_name}`,
          trainerName: trainer.trainer_name,
          date: date || new Date().toISOString().slice(0, 10),
          cutoffTime: '12:00 PM (IST)',
        });
      }
    }

    return NextResponse.json({ success: true, ...result, emailDispatchedTo: targetEmail });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.email || 'kanzariyapratik124@gmail.com';
    const result = DB.run12pmCutoffCheck(body.date);

    // If working day and unlogged trainers found, dispatch absence notifications
    if (result.isWorkingDay && result.totalFlagged > 0) {
      for (const trainer of result.unloggedTrainers) {
        await EmailService.send12pmAbsenceEmail({
          to: targetEmail,
          subject: `⚠️ Notice of Uninformed Absence - ${trainer.trainer_name}`,
          trainerName: trainer.trainer_name,
          date: body.date || new Date().toISOString().slice(0, 10),
          cutoffTime: '12:00 PM (IST)',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: result.isWorkingDay
        ? `12:00 PM Check Completed: ${result.totalFlagged} trainer(s) marked as Not Logged In. Absence email dispatched to ${targetEmail}.`
        : `12:00 PM Check Skipped: Today is a ${result.dayType.replace('_', ' ')}. No absence emails sent.`,
      ...result,
      emailDispatchedTo: targetEmail,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
