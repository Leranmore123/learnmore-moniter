import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batch_id = searchParams.get('batch_id');

    if (batch_id) {
      const coverage = DB.getBatchTopicCoverage(batch_id);
      return NextResponse.json({ success: true, coverage });
    }

    const allCoverage = DB.getAllTopicCoverage();
    return NextResponse.json({ success: true, coverages: allCoverage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
