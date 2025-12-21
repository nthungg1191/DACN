/**
 * RAG Context Builder
 * Xây dựng context từ products, categories và policies để inject vào AI prompt
 */

import { prisma } from '@repo/database';
import { formatPoliciesForRAG } from './policies';
import { cache } from '@/lib/redis';

const RAG_CACHE_TTL = 60 * 5; // 5 phút

interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  // Các thuộc tính mở rộng để bot tư vấn màu/size tốt hơn
  colors?: string[];
  sizes?: string[];
}

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface AdminStats {
  todayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  topProducts: Array<{ id: string; name: string; sold: number; revenue: number }>;
  recentOrders: Array<{ id: string; orderNumber: string; total: number; status: string; createdAt: Date }>;
}

interface RAGContext {
  products: ProductSummary[];
  categories: CategorySummary[];
  policies: string;
  summary: string;
  adminStats?: AdminStats; // Chỉ có khi source=admin
}

/**
 * Lấy danh sách sản phẩm đã published để làm RAG context
 * Giới hạn 100 sản phẩm để tránh prompt quá dài
 */
async function getProductsForRAG(): Promise<ProductSummary[]> {
  const cacheKey = 'rag:products';
  const cached = await cache.get<ProductSummary[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const products = await prisma.product.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      quantity: true,
      variants: {
        select: {
          color: true,
          size: true,
          quantity: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
    take: 100, // Giới hạn 100 sản phẩm
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formatted: ProductSummary[] = products.map((p) => {
    const inStock = p.quantity > 0;

    const variantColors = Array.from(
      new Set(
        (p.variants || [])
          .filter((v) => v.color && (v.quantity ?? 0) > 0)
          .map((v) => v.color as string)
      )
    );

    const variantSizes = Array.from(
      new Set(
        (p.variants || [])
          .filter((v) => v.size && (v.quantity ?? 0) > 0)
          .map((v) => v.size as string)
      )
    );

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description.substring(0, 200), // Giới hạn mô tả
      price: Number(p.price),
      category: p.category.name,
      inStock,
      colors: variantColors.length ? variantColors : undefined,
      sizes: variantSizes.length ? variantSizes : undefined,
    };
  });

  await cache.set(cacheKey, formatted, RAG_CACHE_TTL);
  return formatted;
}

/**
 * Lấy danh sách categories để làm RAG context
 */
async function getCategoriesForRAG(): Promise<CategorySummary[]> {
  const cacheKey = 'rag:categories';
  const cached = await cache.get<CategorySummary[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const formatted: CategorySummary[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || undefined,
  }));

  await cache.set(cacheKey, formatted, RAG_CACHE_TTL);
  return formatted;
}

/**
 * Lấy thống kê admin để phân tích
 */
async function getAdminStats(): Promise<AdminStats> {
  const cacheKey = 'rag:admin_stats';
  const cached = await cache.get<AdminStats>(cacheKey);
  if (cached) {
    return cached;
  }

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayRevenue,
    monthRevenue,
    totalRevenue,
    pendingOrders,
    totalOrders,
    ordersByStatus,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    topProductsData,
    recentOrdersData,
  ] = await Promise.all([
    // Doanh thu hôm nay
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: todayStart },
      },
      _sum: { total: true },
    }),
    // Doanh thu tháng này
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    }),
    // Tổng doanh thu
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    }),
    // Đơn chờ xử lý
    prisma.order.count({ where: { status: 'PENDING' } }),
    // Tổng đơn hàng
    prisma.order.count(),
    // Đơn hàng theo trạng thái
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
    // Tổng khách hàng
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    // Tổng sản phẩm
    prisma.product.count(),
    // Sản phẩm sắp hết hàng
    prisma.product.count({ where: { quantity: { lte: 10 } } }),
    // Top sản phẩm bán chạy (từ orderItems)
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { not: 'CANCELLED' },
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    }),
    // Đơn hàng gần đây
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // Lấy tên sản phẩm cho top products
  const productIds = topProductsData.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const ordersByStatusMap: Record<string, number> = {};
  ordersByStatus.forEach((item) => {
    ordersByStatusMap[item.status] = item._count;
  });

  const stats: AdminStats = {
    todayRevenue: Number(todayRevenue._sum.total || 0),
    monthRevenue: Number(monthRevenue._sum.total || 0),
    totalRevenue: Number(totalRevenue._sum.total || 0),
    pendingOrders,
    totalOrders,
    ordersByStatus: ordersByStatusMap,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    topProducts: topProductsData.map((p) => ({
      id: p.productId,
      name: productMap.get(p.productId) || 'Unknown',
      sold: p._sum.quantity || 0,
      revenue: Number(p._sum.total || 0),
    })),
    recentOrders: recentOrdersData.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt,
    })),
  };

  await cache.set(cacheKey, stats, RAG_CACHE_TTL);
  return stats;
}

/**
 * Build RAG context từ products, categories và policies
 * @param source - 'admin' để thêm admin stats, 'user' hoặc undefined cho user context
 */
export async function buildRAGContext(source?: 'admin' | 'user'): Promise<RAGContext> {
  const [products, categories] = await Promise.all([
    getProductsForRAG(),
    getCategoriesForRAG(),
  ]);

  const policies = formatPoliciesForRAG();

  // Tạo summary
  const categoryList = categories.map((c) => c.name).join(', ');
  const productCount = products.length;
  const inStockCount = products.filter((p) => p.inStock).length;
  const priceRange =
    products.length > 0
      ? `Từ ${Math.min(...products.map((p) => p.price)).toLocaleString('vi-VN')}đ đến ${Math.max(...products.map((p) => p.price)).toLocaleString('vi-VN')}đ`
      : 'Chưa có sản phẩm';

  const summary = `Cửa hàng có ${productCount} sản phẩm (${inStockCount} còn hàng). Danh mục: ${categoryList}. Giá: ${priceRange}.`;

  const context: RAGContext = {
    products,
    categories,
    policies,
    summary,
  };

  // Thêm admin stats nếu source=admin
  if (source === 'admin') {
    context.adminStats = await getAdminStats();
  }

  return context;
}

/**
 * Format RAG context thành text để inject vào prompt
 * Chỉ lấy thông tin cần thiết để tránh prompt quá dài
 */
export function formatRAGContextForPrompt(context: RAGContext, maxProducts: number = 20): string {
  const { products, categories, policies, summary, adminStats } = context;

  // Chỉ lấy một số sản phẩm tiêu biểu (featured hoặc mới nhất)
  const featuredProducts = products.slice(0, maxProducts);

  const productsText =
    featuredProducts.length > 0
      ? featuredProducts
          .map((p) => {
            const colorText = p.colors && p.colors.length ? ` Màu có sẵn: ${p.colors.join(', ')}.` : '';
            const sizeText = p.sizes && p.sizes.length ? ` Size có sẵn: ${p.sizes.join(', ')}.` : '';

            return `- ${p.name} (${p.category}): ${p.description.substring(
              0,
              100
            )}... Giá: ${p.price.toLocaleString('vi-VN')}đ. ${p.inStock ? 'Còn hàng' : 'Hết hàng'}.${colorText}${sizeText} Slug: ${
              p.slug
            } (ID: ${p.id})`;
          })
          .join('\n')
      : 'Chưa có sản phẩm nào.';

  const categoriesText =
    categories.length > 0
      ? categories.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')
      : 'Chưa có danh mục nào.';

  let adminStatsText = '';
  if (adminStats) {
    const ordersByStatusText = Object.entries(adminStats.ordersByStatus)
      .map(([status, count]) => `  - ${status}: ${count} đơn`)
      .join('\n');

    const topProductsText = adminStats.topProducts
      .slice(0, 5)
      .map((p, idx) => `  ${idx + 1}. ${p.name}: Đã bán ${p.sold} sản phẩm, Doanh thu ${p.revenue.toLocaleString('vi-VN')}đ`)
      .join('\n');

    adminStatsText = `

# THỐNG KÊ HỆ THỐNG (Dành cho Admin)

## đơn hàng 
- Tổng số đơn: ${adminStats.totalOrders}
- Đơn chờ xử lý (PENDING): ${adminStats.pendingOrders}
- Phân bố theo trạng thái:
${ordersByStatusText}

## Doanh thu
- Doanh thu hôm nay: ${adminStats.todayRevenue.toLocaleString('vi-VN')}đ
- Doanh thu tháng này: ${adminStats.monthRevenue.toLocaleString('vi-VN')}đ
- Tổng doanh thu: ${adminStats.totalRevenue.toLocaleString('vi-VN')}đ

## Đơn hàng
- Tổng số đơn: ${adminStats.totalOrders}
- Đơn chờ xử lý (PENDING): ${adminStats.pendingOrders}
- Phân bố theo trạng thái:
${ordersByStatusText}

## Khách hàng & Sản phẩm
- Tổng khách hàng: ${adminStats.totalCustomers}
- Tổng sản phẩm: ${adminStats.totalProducts}
- Sản phẩm sắp hết hàng (≤10): ${adminStats.lowStockProducts}

## Top sản phẩm bán chạy
${topProductsText || 'Chưa có dữ liệu'}

## Đơn hàng gần đây (10 đơn mới nhất)
${adminStats.recentOrders
  .map(
    (o) =>
      `- ${o.orderNumber}: ${o.total.toLocaleString('vi-VN')}đ - ${o.status} - ${new Date(o.createdAt).toLocaleDateString('vi-VN')}`
  )
  .join('\n')}

## Hướng dẫn phân tích
Bạn có thể sử dụng dữ liệu trên để:
- Phân tích xu hướng bán hàng (so sánh doanh thu theo thời gian)
- Đánh giá hiệu quả sản phẩm (top bán chạy, sản phẩm cần chú ý)
- Theo dõi tình trạng đơn hàng (số đơn chờ xử lý, phân bố trạng thái)
- Cảnh báo tồn kho (sản phẩm sắp hết hàng)
- Đánh giá khách hàng (tổng số, xu hướng mua hàng)
`;
  }

  return `# THÔNG TIN CỬA HÀNG

## Tổng quan
${summary}

## Danh mục sản phẩm
${categoriesText}

## Sản phẩm nổi bật
${productsText}

${policies}
${adminStatsText}

## Lưu ý quan trọng
- CHỈ tư vấn sản phẩm có trong danh sách trên
- KHÔNG được bịa đặt hoặc đề xuất sản phẩm không tồn tại
- Nếu khách hỏi về sản phẩm không có, hãy gợi ý sản phẩm tương tự trong danh sách
- Luôn kiểm tra tình trạng còn hàng trước khi tư vấn
- Giá cả có thể thay đổi, khuyến khích khách kiểm tra trên website
- Khi tư vấn sản phẩm, LUÔN cung cấp link sản phẩm theo format: /products/{id} (sử dụng ID, không phải slug)
`;
}

/**
 * Invalidate RAG cache (gọi khi có thay đổi products/categories/orders)
 */
export async function invalidateRAGCache(): Promise<void> {
  await Promise.all([
    cache.del('rag:products'),
    cache.del('rag:categories'),
    cache.del('rag:admin_stats'), // Xóa cache admin stats khi có thay đổi
  ]);
}

