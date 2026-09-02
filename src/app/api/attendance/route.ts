import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { whatsappService } from '@/lib/whatsappService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trainer_id = searchParams.get('trainer_id');
    const date = searchParams.get('date');

    let attendances = DB.getAttendances();
    if (trainer_id) {
      attendances = attendances.filter((a) => a.trainer_id === trainer_id);
    }
    if (date) {
      attendances = attendances.filter((a) => a.date === date);
    }

    return NextResponse.json({ success: true, attendances });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, type, trainer_id, photo, selfie_url, latitude, longitude, location_name } = body;

    const effectiveAction = action || (type === 'in' ? 'mark_in' : type === 'out' ? 'mark_out' : null);

    if (!trainer_id) {
      return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });
    }

    const trainer = DB.getUserById(trainer_id);
    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const capturePhoto = photo || selfie_url;

    if (effectiveAction === 'mark_in') {
      const record = DB.markIn({
        trainer_id,
        trainer_name: trainer.name,
        photo_in: capturePhoto,
        latitude,
        longitude,
        location_name: location_name || 'Institute Lab, Main Campus',
      });

      // Automated WhatsApp Broadcast to LEARNMORE-Login-Logout group (4-line concise format)
      if (record?.mark_in_time) {
        await whatsappService.sendAttendanceCheckIn({
          trainer,
          checkInTime: record.mark_in_time,
          locationName: record.location_name || undefined,
        });
      }

      return NextResponse.json({ success: true, record, message: 'Checked In & Logged to WhatsApp Successfully!' });
    } else if (effectiveAction === 'mark_out') {
      const record = DB.markOut({
        trainer_id,
        photo_out: capturePhoto,
        latitude,
        longitude,
        location_name: location_name || 'Institute Lab, Main Campus',
      });
      if (!record) {
        return NextResponse.json({ error: 'No Mark-In record found for today' }, { status: 400 });
      }

      // Calculate total worked minutes
      let totalMinutes = 0;
      if (record.mark_in_time && record.mark_out_time) {
        const inMs = new Date(record.mark_in_time).getTime();
        const outMs = new Date(record.mark_out_time).getTime();
        totalMinutes = Math.max(0, Math.floor((outMs - inMs) / 60000));
      }

      // Automated WhatsApp Broadcast to LEARNMORE-Login-Logout group with 9h shift verification
      if (record.mark_in_time && record.mark_out_time) {
        await whatsappService.sendAttendanceCheckOut({
          trainer,
          checkInTime: record.mark_in_time,
          checkOutTime: record.mark_out_time,
          totalMinutesWorked: totalMinutes,
          latitude: record.latitude || latitude,
          longitude: record.longitude || longitude,
        });
      }

      return NextResponse.json({ success: true, record, message: 'Checked Out & Logged to WhatsApp Successfully!' });
    } else {
      return NextResponse.json({ error: 'Invalid action (must be mark_in or mark_out)' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
