import { NextResponse } from 'next/server';
import { getAllCourses, getCourseById } from '@/lib/syllabusData';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const course = getCourseById(id);
      if (!course) {
        return NextResponse.json({ success: false, error: 'Course syllabus not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, course });
    }

    const courses = getAllCourses();
    return NextResponse.json({ success: true, courses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
