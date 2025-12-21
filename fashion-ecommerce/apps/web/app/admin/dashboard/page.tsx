import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/database';

async function getDashboardStats() {
  try {
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCustomers,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      recentOrders,
      lowStockProducts,
      newCustomers,
      ordersByStatusRaw,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: startOfToday,
          },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: startOfMonth,
          },
        },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        where: {
          quantity: {
            lte: 10,
          },
        },
        orderBy: {
          quantity: 'asc',
        },
        take: 5,
        select: {
          id: true,
          name: true,
          quantity: true,
          sku: true,
        },
      }),
      prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const ordersByStatus: Record<string, number> = {};
    for (const item of ordersByStatusRaw as Array<{ status: string; _count: { id: number } }>) {
      ordersByStatus[item.status] = item._count.id;
    }

    return {
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCustomers,
      totalRevenue: totalRevenue._sum.total || 0,
      todayRevenue: todayRevenue._sum.total || 0,
      monthRevenue: monthRevenue._sum.total || 0,
      recentOrders,
      lowStockProducts,
      newCustomers,
      ordersByStatus,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      recentOrders: [],
      lowStockProducts: [],
      newCustomers: [],
      ordersByStatus: {},
    };
  }
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login?callbackUrl=/admin/dashboard');
  }

  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  const stats = await getDashboardStats();

  const formatCurrency = (amount: number | null | any) => {
    if (!amount) return '0 ₫';
    // Handle Prisma Decimal type
    const numAmount =
      typeof amount === 'object' && amount !== null && 'toNumber' in amount
        ? (amount as any).toNumber()
        : Number(amount);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numAmount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/products/new"
            className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            + Thêm sản phẩm
          </a>
          <a
            href="/admin/orders"
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Xem đơn hàng
          </a>
          <a
            href="/admin/reports"
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Báo cáo chi tiết
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Today revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.todayRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Tính theo đơn đã thanh toán hôm nay.</p>
        </div>

        {/* Month revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doanh thu tháng này</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.monthRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3v18h18M7 14l4-4 4 4 4-4"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Tổng doanh thu của các đơn đã thanh toán.</p>
        </div>

        {/* Pending orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn chờ xử lý</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Số đơn đang ở trạng thái PENDING, cần xử lý sớm.
          </p>
        </div>

        {/* Total summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng quan hệ thống</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalOrders} đơn • {stats.totalCustomers} khách • {stats.totalProducts} sản
                phẩm
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h18M5 7h14l-1 12H6L5 7zM9 11h2m4 0h-2"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Tổng doanh thu từ trước tới nay (đơn đã thanh toán).
          </p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: orders by status overview + recent orders */}
        <div className="xl:col-span-2 space-y-6">
          {/* Orders status summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tình trạng đơn hàng</h2>
                <p className="text-sm text-gray-500">
                  Tóm tắt số lượng đơn theo từng trạng thái để bạn nắm nhanh khối lượng công việc.
                </p>
              </div>
              <a
                href="/admin/reports"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Xem chi tiết
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {([
                {
                  key: 'PENDING',
                  label: 'Chờ xử lý',
                  description: 'Cần xác nhận/xử lý',
                  className: 'bg-yellow-50 text-yellow-800 border-yellow-100',
                },
                {
                  key: 'PROCESSING',
                  label: 'Đang xử lý',
                  description: 'Đang chuẩn bị hàng',
                  className: 'bg-blue-50 text-blue-800 border-blue-100',
                },
                {
                  key: 'SHIPPED',
                  label: 'Đã gửi hàng',
                  description: 'Đang giao cho đơn vị vận chuyển',
                  className: 'bg-purple-50 text-purple-800 border-purple-100',
                },
                {
                  key: 'DELIVERED',
                  label: 'Đã giao',
                  description: 'Hoàn tất giao hàng',
                  className: 'bg-green-50 text-green-800 border-green-100',
                },
                {
                  key: 'CANCELLED',
                  label: 'Đã hủy',
                  description: 'Đơn bị hủy',
                  className: 'bg-red-50 text-red-800 border-red-100',
                },
              ] as const).map((status) => {
                const count =
                  (stats as any).ordersByStatus?.[status.key] &&
                  Number((stats as any).ordersByStatus?.[status.key]);
                return (
                  <div
                    key={status.key}
                    className={`rounded-lg border px-4 py-3 ${status.className}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{status.label}</p>
                      <span className="text-lg font-bold">
                        {Number.isNaN(count) ? 0 : count || 0}
                      </span>
                    </div>
                    <p className="mt-1 text-xs opacity-80">{status.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
                <p className="text-sm text-gray-500">
                  Những đơn mới nhất để bạn theo dõi và xử lý nhanh.
                </p>
              </div>
              <a
                href="/admin/orders"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Xem tất cả
              </a>
            </div>
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
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Chưa có đơn hàng nào.
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.user?.name || order.user?.email || 'Khách lẻ'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'SHIPPED'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: alerts, new customers, quick links */}
        <div className="space-y-6">
          {/* Low stock */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sắp hết hàng</h2>
                <p className="text-sm text-gray-500">
                  Những sản phẩm có tồn kho thấp (≤ 10) cần nhập thêm.
                </p>
              </div>
              <a
                href="/admin/products"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Quản lý sản phẩm
              </a>
            </div>
            <div className="divide-y divide-gray-200 max-h-72 overflow-y-auto">
              {stats.lowStockProducts.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Hiện chưa có sản phẩm nào sắp hết.</div>
              ) : (
                stats.lowStockProducts.map((product: any) => (
                  <a
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        SKU: {product.sku || '—'} • Tồn kho: {product.quantity}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Cảnh báo
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>

          {/* New customers */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Khách hàng mới</h2>
                <p className="text-sm text-gray-500">Những khách hàng vừa đăng ký gần đây.</p>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {stats.newCustomers.length} gần đây
              </span>
            </div>
            <div className="divide-y divide-gray-200 max-h-72 overflow-y-auto">
              {stats.newCustomers.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Chưa có khách hàng mới.</div>
              ) : (
                stats.newCustomers.map((customer: any) => (
                  <div key={customer.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {customer.name || 'Khách không tên'}
                    </p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Tham gia:{' '}
                      {new Date(customer.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tác vụ nhanh</h2>
            <div className="space-y-2 text-sm">
              <a
                href="/admin/coupons"
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
              >
                <span>Quản lý mã giảm giá</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


