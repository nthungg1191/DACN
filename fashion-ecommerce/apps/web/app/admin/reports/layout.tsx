import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/reports');
  }

  return <>{children}</>;
}

