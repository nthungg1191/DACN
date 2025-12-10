'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number; children: number };
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
};

type ModalMode = 'create' | 'edit';

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  image: '',
  parentId: '',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();

export function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);
  const [filters, setFilters] = useState<{ keyword: string }>({ keyword: '' });
  const [pagination, setPagination] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  });
  const [sort, setSort] = useState<'name-asc' | 'name-desc'>('name-asc');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Không thể tải danh mục');
      }
      setCategories(json.data || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setMode('create');
    setForm(emptyForm);
    setEditingId(null);
    setSlugDirty(false);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setMode('edit');
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      image: cat.image || '',
      parentId: cat.parentId || '',
    });
    setSlugDirty(true); // keep existing slug unless user edits
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = confirm('Bạn có chắc muốn xóa danh mục này?');
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Xóa thất bại');
      }
      toast.success('Đã xóa danh mục');
      loadCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      description: form.description.trim() || null,
      image: form.image.trim() || null,
      parentId: form.parentId || null,
    };

    if (!payload.name || !payload.slug) {
      toast.error('Tên và slug là bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        mode === 'create'
          ? '/api/admin/categories'
          : `/api/admin/categories/${editingId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Lưu thất bại');
      }

      toast.success(mode === 'create' ? 'Đã tạo danh mục' : 'Đã cập nhật danh mục');
      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!filters.keyword) return categories;
    const kw = filters.keyword.toLowerCase();
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(kw) ||
        c.slug?.toLowerCase().includes(kw) ||
        c.description?.toLowerCase().includes(kw)
    );
  }, [categories, filters.keyword]);

  const sortedCategories = useMemo(() => {
    const arr = [...filteredCategories];
    arr.sort((a, b) => {
      const na = (a.name || '').toLowerCase();
      const nb = (b.name || '').toLowerCase();
      if (sort === 'name-asc') return na.localeCompare(nb, 'vi');
      return nb.localeCompare(na, 'vi');
    });
    return arr;
  }, [filteredCategories, sort]);

  const paginatedCategories = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const total = sortedCategories.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    const safePage = Math.min(pagination.page, totalPages);
    const safeStart = (safePage - 1) * pagination.limit;
    const safeEnd = safeStart + pagination.limit;
    return {
      total,
      totalPages,
      page: safePage,
      items: sortedCategories.slice(safeStart, safeEnd),
    };
  }, [sortedCategories, pagination.page, pagination.limit]);

  const handleSearchChange = (value: string) => {
    setPagination((p) => ({ ...p, page: 1 }));
    setFilters((f) => ({ ...f, keyword: value }));
  };

  const goToPage = (page: number) => {
    setPagination((p) => ({ ...p, page }));
  };

  const handleImageUpload = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((prev) => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const parentOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-600 mt-1">Tạo, sửa, xóa danh mục sản phẩm</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 flex flex-col gap-3 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Tìm theo tên hoặc slug..."
              value={filters.keyword}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <select
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'name-asc' | 'name-desc')}
            >
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
            </select>
            <select
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={pagination.limit}
              onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/trang
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục cha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục con
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : paginatedCategories.total === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Chưa có danh mục nào
                  </td>
                </tr>
              ) : (
                paginatedCategories.items.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.parent?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category._count?.products ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category._count?.children ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => openEdit(category)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        onClick={() => handleDelete(category.id)}
                        disabled={submitting}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginatedCategories.totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Hiển thị {(paginatedCategories.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(paginatedCategories.page * pagination.limit, paginatedCategories.total)} trên{' '}
              {paginatedCategories.total} danh mục
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(Math.max(1, paginatedCategories.page - 1))}
                disabled={paginatedCategories.page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {paginatedCategories.page}/{paginatedCategories.totalPages}
              </span>
              <button
                onClick={() => goToPage(Math.min(paginatedCategories.totalPages, paginatedCategories.page + 1))}
                disabled={paginatedCategories.page >= paginatedCategories.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white disabled:opacity-50"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <h3 className="text-lg font-semibold mb-4">
              {mode === 'create' ? 'Thêm danh mục' : 'Sửa danh mục'}
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name: value,
                      slug: slugDirty ? prev.slug : slugify(value),
                    }));
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugDirty(true);
                    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh (URL)</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.image}
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://..."
                />
                <div className="mt-2 flex items-center gap-2">
                  <label className="px-3 py-2 text-sm border border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100">
                    Chọn file ảnh
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    />
                  </label>
                  {form.image && (
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                      {form.image.startsWith('data:') ? 'Đã chọn file (data URL)' : form.image}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Có thể dán URL hoặc chọn file (tối ưu JPG/PNG, &lt;1MB). Tham khảo ảnh demo từ https://picsum.photos.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                >
                  <option value="">-- Không chọn --</option>
                  {parentOptions
                    .filter((opt) => !editingId || opt.id !== editingId)
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

