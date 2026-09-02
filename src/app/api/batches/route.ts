import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { whatsappService } from '@/lib/whatsappService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trainer_id = searchParams.get('trainer_id');

    let batches = DB.getBatches();
    if (trainer_id) {
      batches = batches.filter((b) => b.trainer_id === trainer_id);
    }

    return NextResponse.json({ success: true, batches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.trainer_id || !body.total_hours) {
      return NextResponse.json({ error: 'Name, Trainer and Total Hours are required' }, { status: 400 });
    }

    const trainer = DB.getUserById(body.trainer_id);
    
    // Auto-create WhatsApp Group if enabled or group name provided
    let waGroupName = body.whatsapp_group_name;
    let waGroupId = body.whatsapp_group_id;
    let waGroupLink = body.whatsapp_group_link;

    const studentList = Array.isArray(body.students) ? body.students : [];
    const totalStudentsCount = studentList.length > 0 ? studentList.length : Number(body.total_students || 0);

    if (body.auto_whatsapp_group !== false || waGroupName) {
      const waRes = await whatsappService.createBatchGroup({
        batchName: body.name,
        customGroupName: waGroupName,
        trainer: trainer || null,
        students: studentList,
      });
      waGroupName = waRes.groupName;
      waGroupId = waRes.groupId;
      waGroupLink = waRes.inviteLink;
    }

    const newBatch = DB.createBatch({
      name: body.name,
      course_id: body.course_id,
      course_name: body.course_name,
      trainer_id: body.trainer_id,
      trainer_name: trainer?.name || 'Trainer',
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      total_hours: Number(body.total_hours),
      total_students: totalStudentsCount,
      batch_type: body.batch_type || 'training',
      is_active: body.is_active ?? true,
      is_completed: false,
      whatsapp_group_name: waGroupName,
      whatsapp_group_id: waGroupId,
      whatsapp_group_link: waGroupLink,
      auto_whatsapp_group: body.auto_whatsapp_group !== false,
    });

    // Save customized enrolled students with their phone numbers
    let savedStudents: any[] = [];
    if (studentList.length > 0) {
      savedStudents = DB.createStudentsForBatch(newBatch.id, newBatch.name, studentList);
    } else {
      savedStudents = DB.getStudentsByBatchId(newBatch.id);
    }

    // Automatically send initial assignment welcome message to the new WhatsApp Group
    if (waGroupName) {
      await whatsappService.sendBatchWelcomeMessage({
        batch: newBatch,
        trainer: trainer || null,
      });
    }

    return NextResponse.json({
      success: true,
      batch: newBatch,
      students: savedStudents,
      whatsapp: { groupName: waGroupName, inviteLink: waGroupLink },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    const updates: any = { ...body };
    delete updates.id;

    if (updates.name) {
      updates.whatsapp_group_name = updates.name; // Keep Batch Name and WhatsApp Group Name 100% identical
    }

    if (updates.trainer_id) {
      const trainer = DB.getUserById(updates.trainer_id);
      if (trainer) updates.trainer_name = trainer.name;
    }

    const updated = DB.updateBatch(body.id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, batch: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

