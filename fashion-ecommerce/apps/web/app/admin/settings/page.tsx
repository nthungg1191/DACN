import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

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

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Tính năng đang được phát triển...</p>
      </div>
    </div>
  );
}

