'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AnnouncementType = 'INFO' | 'COUPON' | 'EVENT';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  ctaLabel: string | null;
  ctaUrl: string | null;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

interface Props {
  initialAnnouncements: Announcement[];
}

export function AdminAnnouncementsClient({ initialAnnouncements }: Props) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'INFO' as AnnouncementType,
    ctaLabel: '',
    ctaUrl: '',
    active: true,
    startAt: '',
    endAt: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type,
          ctaLabel: form.ctaLabel.trim() || null,
          ctaUrl: form.ctaUrl.trim() || null,
          active: form.active,
          startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
          endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Tạo thông báo thất bại');
      }

      const created: Announcement = {
        ...data.data,
        ctaLabel: data.data.ctaLabel ?? null,
        ctaUrl: data.data.ctaUrl ?? null,
        startAt: data.data.startAt ?? null,
        endAt: data.data.endAt ?? null,
        createdAt: data.data.createdAt,
      };

      setAnnouncements((prev) => [created, ...prev]);
      setForm({
        title: '',
        message: '',
        type: 'INFO',
        ctaLabel: '',
        ctaUrl: '',
        active: true,
        startAt: '',
        endAt: '',
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Cập nhật trạng thái thất bại');
      }

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: data.data.active } : a))
      );
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa thông báo này?')) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Xóa thất bại');
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thông báo hệ thống</h1>
        <p className="text-gray-600 mt-1">
          Gửi thông tin về mã giảm giá, sự kiện, chiến dịch đến người dùng qua popup nổi.
        </p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tạo thông báo mới</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề *
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại thông báo
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value as AnnouncementType)}
              >
                <option value="INFO">Thông tin chung</option>
                <option value="COUPON">Mã giảm giá / ưu đãi</option>
                <option value="EVENT">Sự kiện / campaign</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung *
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhãn nút (CTA)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: Xem chi tiết, Dùng mã ngay"
                value={form.ctaLabel}
                onChange={(e) => handleChange('ctaLabel', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link (CTA URL)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                value={form.ctaUrl}
                onChange={(e) => handleChange('ctaUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bắt đầu từ
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startAt}
                onChange={(e) => handleChange('startAt', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kết thúc vào
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endAt}
                onChange={(e) => handleChange('endAt', e.target.value)}
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={form.active}
                  onChange={(e) => handleChange('active', e.target.checked)}
                />
                Kích hoạt ngay
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Đang lưu...' : 'Tạo thông báo'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách thông báo</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {announcements.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">Chưa có thông báo nào.</div>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{a.title}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.type === 'COUPON'
                          ? 'bg-emerald-50 text-emerald-700'
                          : a.type === 'EVENT'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {a.type}
                    </span>
                    {a.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        Đang bật
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Đã tắt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{a.message}</p>
                  <p className="text-xs text-gray-400">
                    Từ: {a.startAt ? new Date(a.startAt).toLocaleString('vi-VN') : 'Ngay lập tức'} •
                    Đến:{' '}
                    {a.endAt ? new Date(a.endAt).toLocaleString('vi-VN') : 'Không giới hạn'}
                  </p>
                  {a.ctaUrl && (
                    <p className="text-xs text-blue-600 break-all">
                      Link: <a href={a.ctaUrl}>{a.ctaUrl}</a>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(a.id, a.active)}
                    className="px-3 py-1 rounded-md border text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {a.active ? 'Tắt' : 'Bật'}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="px-3 py-1 rounded-md border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


