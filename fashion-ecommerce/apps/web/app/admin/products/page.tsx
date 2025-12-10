import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@repo/database';
import { ProductsFilters } from '@/components/admin/products/ProductsFilters';

export const dynamic = 'force-dynamic';

async function getProducts(page: number = 1, limit: number = 20, search?: string, categoryId?: string, published?: string) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (published !== undefined) {
      where.published = published === 'true';
    }

    const [rawProducts, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              variants: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    const products = rawProducts.map((p) => ({
      ...p,
      price: p.price.toNumber ? p.price.toNumber() : Number(p.price),
      comparePrice: p.comparePrice ? (p.comparePrice.toNumber ? p.comparePrice.toNumber() : Number(p.comparePrice)) : null,
      costPrice: p.costPrice ? (p.costPrice.toNumber ? p.costPrice.toNumber() : Number(p.costPrice)) : null,
    }));

    return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, categories };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, categories: [] };
  }
}

export default async function AdminProductsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string; published?: string }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/products');
  }

  const searchParams = await searchParamsPromise;

  const page = parseInt(searchParams.page || '1');
  const { products, pagination, categories } = await getProducts(
    page,
    20,
    searchParams.search,
    searchParams.categoryId,
    searchParams.published
  );

  const formatCurrency = (amount: number | null | any) => {
    if (!amount) return '0 ₫';
    const numAmount = typeof amount === 'object' && 'toNumber' in amount 
      ? amount.toNumber() 
      : Number(amount);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numAmount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-1">Xem và quản lý tất cả sản phẩm</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Thêm sản phẩm
        </Link>
      </div>

      {/* Filters */}
      <ProductsFilters categories={categories} />

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Chưa có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded mr-3" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.published ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Sửa
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Hiển thị {((pagination.page - 1) * pagination.limit + 1).toLocaleString()} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()} của{' '}
              {pagination.total.toLocaleString()} sản phẩm
            </div>
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              {pagination.page > 1 ? (
                <Link
                  href={`/admin/products?${new URLSearchParams({
                    ...Object.fromEntries(
                      Object.entries(searchParams).filter(([key]) => key !== 'page')
                    ),
                    page: String(pagination.page - 1),
                  }).toString()}`}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Trước
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-sm text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
                  Trước
                </span>
              )}

              {/* Page Numbers */}
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                {(() => {
                  const currentPage = pagination.page;
                  const totalPages = pagination.totalPages;
                  const pages: (number | string)[] = [];
                  const maxVisible = 5;

                  if (totalPages <= maxVisible) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push(1);

                    let start = Math.max(2, currentPage - 1);
                    let end = Math.min(totalPages - 1, currentPage + 1);

                    if (currentPage <= 3) {
                      start = 2;
                      end = Math.min(5, totalPages - 1);
                    }

                    if (currentPage >= totalPages - 2) {
                      start = Math.max(2, totalPages - 4);
                      end = totalPages - 1;
                    }

                    if (start > 2) {
                      pages.push('...');
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(i);
                    }

                    if (end < totalPages - 1) {
                      pages.push('...');
                    }

                    if (totalPages > 1) {
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((pageNum, index) => {
                    if (pageNum === '...') {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-3 py-1.5 text-sm text-gray-500 bg-white border-r border-gray-300"
                        >
                          ...
                        </span>
                      );
                    }

                    const page = pageNum as number;
                    const isActive = page === currentPage;
                    const isLast = index === pages.length - 1;

                    const params = new URLSearchParams({
                      ...Object.fromEntries(
                        Object.entries(searchParams).filter(([key]) => key !== 'page')
                      ),
                      page: String(page),
                    });

                    return (
                      <Link
                        key={page}
                        href={`/admin/products?${params.toString()}`}
                        className={`px-3 py-1.5 text-sm border-r border-gray-300 ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        } transition-colors ${isLast ? 'border-r-0' : ''}`}
                      >
                        {page}
                      </Link>
                    );
                  });
                })()}
              </div>

              {/* Next Button */}
              {pagination.page < pagination.totalPages ? (
                <Link
                  href={`/admin/products?${new URLSearchParams({
                    ...Object.fromEntries(
                      Object.entries(searchParams).filter(([key]) => key !== 'page')
                    ),
                    page: String(pagination.page + 1),
                  }).toString()}`}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Tiếp
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-sm text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
                  Tiếp
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

