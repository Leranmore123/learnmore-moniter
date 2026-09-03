import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL('/login', url.origin));
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let username = '';
    let password = '';

    // Support both JSON and normal form submissions
    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData();

      username = String(formData.get('username') || '');
      password = String(formData.get('password') || '');
    } else {
      const body = await req.json();

      username = String(body?.username || '');
      password = String(body?.password || '');
    }

    username = username.trim();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Username and password are required',
          },
        },
        { status: 400 }
      );
    }

    // Get users from database
    const allUsers = DB.getUsers();

    const cleanUsername = username.toLowerCase();

    // Find exact username or email match
    const user = allUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        u.email.toLowerCase() === cleanUsername
    );

    // User not found
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password',
          },
        },
        { status: 401 }
      );
    }

    // Exact password validation
    if (user.password !== password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password',
          },
        },
        { status: 401 }
      );
    }

    // Remove password before sending user data to browser
    const { password: _password, ...safeUser } = user;

    // Cookie data
    const cookieData = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        role: user.role,
        name: user.name,
      })
    );

    // Detect HTTPS / proxy
    const forwardedProto = req.headers.get('x-forwarded-proto') || '';
    const isHttps =
      forwardedProto === 'https' ||
      req.url.startsWith('https:');

    // Create response
    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

    // Save authentication cookie
    response.cookies.set({
      name: 'trainer_user',
      value: cookieData,
      path: '/',
      maxAge: 604800,
      httpOnly: false,
      sameSite: 'lax',
      secure: isHttps,
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Server error. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}