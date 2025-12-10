import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { CategoriesClient } from '@/components/admin/categories/CategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/categories');
  }

  return <CategoriesClient />;
}

