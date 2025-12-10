'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Copy, Eye, Trash2 } from 'lucide-react';

type Props = {
  productId: string;
};

export function ProductActionsClient({ productId }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirm = window.confirm('Bạn có chắc muốn xóa sản phẩm này?');
    if (!confirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Xóa sản phẩm thất bại');
      }
      router.replace('/admin/products');
      router.refresh();
    } catch (error: any) {
      alert(error?.message || 'Xóa sản phẩm thất bại');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
      <div className="space-y-2">
        <Link
          href={`/products/${productId}`}
          target="_blank"
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Xem trên website
        </Link>
        <button
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          type="button"
          disabled
        >
          <Copy className="w-4 h-4" />
          Nhân đôi sản phẩm (đang phát triển)
        </button>
        <button
          onClick={handleDelete}
          type="button"
          disabled={deleting}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
        </button>
      </div>
    </div>
  );
}

