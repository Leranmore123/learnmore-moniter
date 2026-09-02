import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const course = DB.getCourseById(id);
      if (!course) {
        return NextResponse.json({ success: false, error: 'Course syllabus not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, course });
    }

    const courses = DB.getCourses();
    return NextResponse.json({ success: true, courses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.category) {
      return NextResponse.json({ success: false, error: 'Course name and category are required' }, { status: 400 });
    }

    const newCourse = DB.createCourse({
      name: body.name.trim(),
      category: body.category.trim(),
      default_hours: Number(body.default_hours || 40),
      description: body.description?.trim() || '',
      modules: Array.isArray(body.modules) ? body.modules : [],
    });

    return NextResponse.json({ success: true, course: newCourse });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Course ID is required' }, { status: 400 });
    }

    const { id, ...updates } = body;
    const updated = DB.updateCourse(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, course: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Course ID is required' }, { status: 400 });
    }

    const deleted = DB.deleteCourse(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

