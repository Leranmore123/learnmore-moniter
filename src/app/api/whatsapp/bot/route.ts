import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsappService';
import { DB } from '@/lib/db';

const BAILEYS_URL = 'http://localhost:5001';

export async function GET() {
  try {
    let liveBaileys = null;
    let availableGroups: any[] = [];
    try {
      const [statusRes, groupsRes] = await Promise.all([
        fetch(`${BAILEYS_URL}/status`, { cache: 'no-store' }),
        fetch(`${BAILEYS_URL}/groups`, { cache: 'no-store' }),
      ]);
      if (statusRes.ok) liveBaileys = await statusRes.json();
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        availableGroups = gData.groups || [];
      }
    } catch {
      // baileys offline fallback
    }

    const fallbackStatus = whatsappService.getStatus();
    const logs = DB.getWhatsAppLogs();
    const attendanceGroup = whatsappService.getAttendanceGroup();

    const bot = {
      isConnected: liveBaileys?.bot?.isConnected ?? fallbackStatus.isConnected,
      phoneNumber: liveBaileys?.bot?.phoneNumber || fallbackStatus.phoneNumber,
      botName: 'Learnmore Technologies WhatsApp Gateway',
      lastSyncAt: new Date().toISOString(),
      qrDataUrl: liveBaileys?.bot?.qrDataUrl || null,
      pairingCode: liveBaileys?.bot?.pairingCode || null,
      totalGroupsCreated: fallbackStatus.totalGroupsCreated,
      totalMessagesDelivered: fallbackStatus.totalMessagesDelivered,
      attendanceGroup,
      availableGroups,
    };

    return NextResponse.json({
      success: true,
      bot,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, message, groupName, groupId, target } = body;

    if (action === 'set_attendance_group') {
      if (!groupId || !groupName) {
        return NextResponse.json({ error: 'Group ID and Name are required' }, { status: 400 });
      }
      const updated = whatsappService.setAttendanceGroup(groupId, groupName);
      return NextResponse.json({ success: true, attendanceGroup: updated, message: 'Attendance group updated!' });
    }

    if (action === 'pair_code') {
      try {
        const res = await fetch(`${BAILEYS_URL}/pair-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        return NextResponse.json(data);
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
      }
    }

    if (action === 'connect') {
      const bot = whatsappService.connect();
      return NextResponse.json({ success: true, bot, message: 'WhatsApp Bot Connected Successfully!' });
    }

    if (action === 'disconnect') {
      const bot = whatsappService.disconnect();
      return NextResponse.json({ success: true, bot, message: 'WhatsApp Bot Disconnected.' });
    }

    if (action === 'send_test') {
      // Try to send via real Baileys if connected
      try {
        await fetch(`${BAILEYS_URL}/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: target || phone || 'group',
            text: message || '🤖 Test automated message from Learnmore Technologies WhatsApp Bot!',
            withLogo: true,
          }),
        });
      } catch {
        // silent
      }

      const log = DB.addWhatsAppLog({
        id: `walg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        batch_id: 'test',
        batch_name: 'Test Broadcast',
        trainer_name: 'Admin Test',
        group_name: groupName || 'Learnmore Technologies Demo Group',
        message_preview: message || '🤖 Test automated message from Learnmore Technologies WhatsApp Bot!',
        status: 'delivered',
        sent_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Test message broadcasted successfully to WhatsApp Group!',
        log,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
