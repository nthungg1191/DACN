'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  productCount?: number;
  children?: CategoryNode[];
};

type ApiResponse = {
  success: boolean;
  data?: CategoryNode[];
  error?: string;
};

const placeholder =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="No image"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="20">No Image</text></svg>';

const safeImage = (url?: string | null) => (url && url.trim() ? url : placeholder);

function CategoryCard({ category }: { category: CategoryNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="relative h-40 w-full bg-gray-100">
        <img
          src={safeImage(category.image)}
          alt={category.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
            )}
          </div>
          {typeof category.productCount === 'number' && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
              {category.productCount} sản phẩm
            </span>
          )}
        </div>

        {category.children && category.children.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {category.children.slice(0, 5).map((child: any) => (
              <Link
                key={child.id}
                href={`/products?categories=${child.id}`}
                className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                {child.name}
              </Link>
            ))}
            {category.children.length > 5 && (
              <span className="text-xs text-gray-500">+{category.children.length - 5} khác</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2">
          <Link
            href={`/products?categories=${category.id}`}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition w-full"
          >
            Xem sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/categories');
        const json: ApiResponse = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Không thể tải danh mục');
        }
        setCategories(json.data);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải danh mục');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Danh mục sản phẩm</h1>
        <p className="text-gray-600">Khám phá các danh mục và tìm sản phẩm bạn quan tâm.</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-16">Đang tải danh mục...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-16">{error}</div>
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-500 py-16">Chưa có danh mục nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat: any) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </div>
  );
}

