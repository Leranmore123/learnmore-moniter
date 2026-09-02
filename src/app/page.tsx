import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('trainer_user')?.value;

  if (!userCookie) {
    redirect('/login');
  }

  try {
    const user = JSON.parse(decodeURIComponent(userCookie));
    if (user?.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/trainer/dashboard');
    }
  } catch {
    redirect('/login');
  }
}
