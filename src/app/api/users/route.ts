import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    let users = DB.getUsers();
    if (role) {
      users = users.filter((u) => u.role === role);
    }
    const safeUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.username || !body.name || !body.email || !body.role) {
      return NextResponse.json({ error: 'Username, Name, Email, and Role are required' }, { status: 400 });
    }

    const existing = DB.getUserByUsername(body.username);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const newUser = DB.createUser({
      username: body.username,
      name: body.name,
      email: body.email,
      role: body.role,
      password: body.password || 'trainer',
      phone: body.phone,
      designation: body.designation,
      hourly_rate: Number(body.hourly_rate || 500),
      avatar: body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.username}`,
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const updated = DB.updateUser(id, updates);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { password: _, ...safeUser } = updated;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const deleted = DB.deleteUser(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
