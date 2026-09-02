import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const balances = DB.getAllTrainerLeaveBalances();
    const auditLogs = DB.getLeaveAuditLogs();
    return NextResponse.json({ success: true, balances, auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trainer_id, admin_name, leave_type, new_balance, reason } = body;

    if (!trainer_id || !leave_type || new_balance === undefined) {
      return NextResponse.json(
        { error: 'trainer_id, leave_type, and new_balance are required' },
        { status: 400 }
      );
    }

    const numBalance = Number(new_balance);
    if (isNaN(numBalance) || numBalance < 0) {
      return NextResponse.json({ error: 'Valid positive number is required' }, { status: 400 });
    }

    const res = DB.adjustTrainerLeaveBalance({
      trainer_id,
      admin_name: admin_name || 'Admin',
      leave_type,
      new_balance: numBalance,
      reason: reason || 'Administrative quota adjustment',
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to adjust' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Leave balance updated to ${numBalance}. Audit log created.`,
      balance: res.balance,
      auditLog: res.auditLog,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
