import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('trainer_user')?.value;

  if (!userCookie) {
    redirect('/login');
  }

<<<<<<< HEAD
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      window.location.href = '/login';
    } else if (user.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/trainer/dashboard';
=======
  try {
    const user = JSON.parse(decodeURIComponent(userCookie));
    if (user?.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/trainer/dashboard');
>>>>>>> 165726b (Fix login form submission, server-side redirect, and sidebar responsiveness)
    }
  } catch {
    redirect('/login');
  }
}
