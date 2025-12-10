'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
}

interface ProductsFiltersProps {
  categories: Category[];
}

export function ProductsFilters({ categories }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [published, setPublished] = useState(searchParams.get('published') || '');

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update all filter params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set('page', '1');

    router.push(`/admin/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategoryId(value);
    updateFilters({ categoryId: value });
  };

  const handlePublishedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPublished(value);
    updateFilters({ published: value });
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setPublished('');
    router.push('/admin/products');
  };

  const hasActiveFilters = search || categoryId || published;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </form>

        {/* Category Filter */}
        <select
          value={categoryId}
          onChange={handleCategoryChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Published Filter */}
        <select
          value={published}
          onChange={handlePublishedChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tất cả</option>
          <option value="true">Đã xuất bản</option>
          <option value="false">Chưa xuất bản</option>
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}

