import { requireAdmin } from '@/lib/auth-server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@repo/database';
import { User, Mail, Calendar, Package, DollarSign, MapPin, Star } from 'lucide-react';

async function getCustomerDetail(customerId: string, page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;

    const customer = await prisma.user.findUnique({
      where: { id: customerId, role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!customer) return null;

    // Get orders with pagination
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          items: {
            take: 3,
            select: {
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
      prisma.order.count({
        where: { userId: customerId },
      }),
    ]);

    // Calculate total spent
    const totalSpent = await prisma.order.aggregate({
      where: {
        userId: customerId,
        paymentStatus: 'PAID',
      },
      _sum: {
        total: true,
      },
    });

    // Serialize Decimal fields
    return {
      ...customer,
      totalSpent: totalSpent._sum.total?.toNumber() || 0,
      orders: orders.map((order: any) => ({
        ...order,
        total: order.total.toNumber(),
      })),
      ordersPagination: {
        page,
        limit,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return null;
  }
}

const getStatusBadge = (status: string) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
    SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  };
  return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đã giao hàng',
    DELIVERED: 'Đã nhận hàng',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] || status;
};

const getPaymentStatusBadge = (status: string) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getPaymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
  };
  return labels[status] || status;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/customers');
  }

  const page = parseInt(searchParams.page || '1');
  const customer = await getCustomerDetail(params.id, page, 10);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/customers"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Quay lại danh sách khách hàng
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết khách hàng</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              {customer.image ? (
                <img
                  src={customer.image}
                  alt={customer.name || 'Customer'}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-2xl">
                    {(customer.name || customer.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {customer.name || 'N/A'}
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Thành viên từ: {formatDate(customer.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customer._count.orders}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số đánh giá</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customer._count.reviews}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
              <Link
                href={`/admin/orders?customer=${customer.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Xem tất cả →
              </Link>
            </div>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Khách hàng chưa có đơn hàng nào
              </p>
            ) : (
              <div className="space-y-4">
                {customer.orders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusBadge(
                              order.paymentStatus
                            )}`}
                          >
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                        {order.items.slice(0, 3).map((item: any, idx: number) => (
                          item.product?.images && item.product.images.length > 0 && (
                            <img
                              key={idx}
                              src={
                                Array.isArray(item.product.images)
                                  ? item.product.images[0]
                                  : item.product.images
                              }
                              alt={item.product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{order.items.length - 3} sản phẩm khác
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {customer.ordersPagination && customer.ordersPagination.totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  {/* Page Info */}
                  <div className="text-sm text-gray-600">
                    Hiển thị{' '}
                    {((customer.ordersPagination.page - 1) * customer.ordersPagination.limit + 1).toLocaleString()}{' '}
                    -{' '}
                    {Math.min(
                      customer.ordersPagination.page * customer.ordersPagination.limit,
                      customer.ordersPagination.total
                    ).toLocaleString()}{' '}
                    của {customer.ordersPagination.total.toLocaleString()} đơn hàng
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-1">
                    {/* Previous Button */}
                    {customer.ordersPagination.page > 1 ? (
                      <Link
                        href={`/admin/customers/${customer.id}?page=${customer.ordersPagination.page - 1}`}
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
                        const currentPage = customer.ordersPagination.page;
                        const totalPages = customer.ordersPagination.totalPages;
                        const pages: (number | string)[] = [];
                        const maxVisible = 5; // Limit to 5 page numbers like in the image

                        if (totalPages <= maxVisible) {
                          // Show all pages if total is less than maxVisible
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Always show first page
                          pages.push(1);

                          // Calculate start and end of visible range
                          let start = Math.max(2, currentPage - 1);
                          let end = Math.min(totalPages - 1, currentPage + 1);

                          // Adjust if we're near the start
                          if (currentPage <= 3) {
                            start = 2;
                            end = Math.min(5, totalPages - 1);
                          }

                          // Adjust if we're near the end
                          if (currentPage >= totalPages - 2) {
                            start = Math.max(2, totalPages - 4);
                            end = totalPages - 1;
                          }

                          // Add ellipsis after first page if needed
                          if (start > 2) {
                            pages.push('...');
                          }

                          // Add visible page numbers
                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }

                          // Add ellipsis before last page if needed
                          if (end < totalPages - 1) {
                            pages.push('...');
                          }

                          // Always show last page
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

                          return (
                            <Link
                              key={page}
                              href={`/admin/customers/${customer.id}?page=${page}`}
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
                    {customer.ordersPagination.page < customer.ordersPagination.totalPages ? (
                      <Link
                        href={`/admin/customers/${customer.id}?page=${customer.ordersPagination.page + 1}`}
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
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Addresses */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h3>
            </div>
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-4">
                {customer.addresses.map((address: any) => (
                  <div
                    key={address.id}
                    className={`p-4 border rounded-lg ${
                      address.isDefault
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {address.isDefault && (
                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded mb-2">
                        Mặc định
                      </span>
                    )}
                    <p className="font-medium text-gray-900">{address.fullName}</p>
                    <p className="text-sm text-gray-600">{address.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.street}, {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Khách hàng chưa có địa chỉ nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

