import { redirect } from 'next/navigation';
import { getCurrentUser, isDeveloper } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  if (!isDeveloper(user.username)) {
    redirect('/workspace');
  }
  return <>{children}</>;
}
