import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AdminTemplate } from '@/components/admin/template/AdminTemplate';

// Force dynamic rendering for all admin routes
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current pathname from middleware header
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isLoginPage = pathname === '/admin/login';

  // Bypass auth check for login page
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  const user = await getCurrentUser();

  // Check authentication and admin role
  if (!user) {
    // Preserve current path in callbackUrl for redirect after login
    const currentPath = pathname || '/admin/dashboard';
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(currentPath)}`);
  }

  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  // Admin layout chỉ check auth, template sẽ render UI
  return <AdminTemplate>{children}</AdminTemplate>;
}
