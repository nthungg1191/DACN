import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@repo/database';
import { OrdersFilters } from '@/components/admin/orders/OrdersFilters';

async function getOrders(
  page: number = 1,
  limit: number = 20,
  status?: string,
  paymentStatus?: string,
  search?: string,
  dateFrom?: string,
  dateTo?: string
) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

export default async function AdminOrdersPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/orders');
  }

  const searchParams = await searchParamsPromise;

  const page = parseInt(searchParams.page || '1');
  const { orders, pagination } = await getOrders(
    page,
    20,
    searchParams.status,
    searchParams.paymentStatus,
    searchParams.search,
    searchParams.dateFrom,
    searchParams.dateTo
  );

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-gray-600 mt-1">Xem và quản lý tất cả đơn hàng</p>
          </div>
        </div>

        {/* Filters */}
        <OrdersFilters />

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{order.user?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{order.user?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(Number(order.total))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xem chi tiết
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
                {pagination.total.toLocaleString()} đơn hàng
              </div>
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                {pagination.page > 1 ? (
                  <Link
                    href={`/admin/orders?${new URLSearchParams({
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
                          href={`/admin/orders?${params.toString()}`}
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
                    href={`/admin/orders?${new URLSearchParams({
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

