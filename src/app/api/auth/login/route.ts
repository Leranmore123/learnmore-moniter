import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const allUsers = DB.getUsers();
    const cleanUser = username.trim().toLowerCase();

    // Find matching user by username, email, or name
    let user = allUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        u.name.toLowerCase().includes(cleanUser) ||
        u.username.toLowerCase().startsWith(cleanUser)
    );

    // Default fallback if admin or trainer is typed
    if (!user) {
      if (cleanUser.includes('admin')) {
        user = allUsers.find((u) => u.role === 'admin') || allUsers[0];
      } else {
        user = allUsers.find((u) => u.role === 'trainer') || allUsers[1];
      }
    }

    // Password validation - accepts correct DB password, '123456', 'admin', 'trainer', 'pass123'
    const isValid =
      user.password === password ||
      password === '123456' ||
      password === 'admin' ||
      password === 'trainer' ||
      password === 'pass123' ||
      password.length >= 1; // Accept any submitted non-empty password for easy demo login

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
