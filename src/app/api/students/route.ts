import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batch_id = searchParams.get('batch_id');

    if (batch_id) {
      const students = DB.getStudentsByBatchId(batch_id);
      return NextResponse.json({ success: true, students });
    }

    const students = DB.getAllStudents();
    return NextResponse.json({ success: true, students });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
