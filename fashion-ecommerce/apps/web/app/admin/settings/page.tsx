import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { SettingsClient } from '@/components/admin/settings/SettingsClient';

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/settings');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Cấu hình hệ thống</p>
      </div>

      <SettingsClient />
    </div>
  );
}

