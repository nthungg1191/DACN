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
}

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface RAGContext {
  products: ProductSummary[];
  categories: CategorySummary[];
  policies: string;
  summary: string;
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

  const formatted: ProductSummary[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description.substring(0, 200), // Giới hạn mô tả
    price: Number(p.price),
    category: p.category.name,
    inStock: p.quantity > 0,
  }));

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
 * Build RAG context từ products, categories và policies
 */
export async function buildRAGContext(): Promise<RAGContext> {
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

  return {
    products,
    categories,
    policies,
    summary,
  };
}

/**
 * Format RAG context thành text để inject vào prompt
 * Chỉ lấy thông tin cần thiết để tránh prompt quá dài
 */
export function formatRAGContextForPrompt(context: RAGContext, maxProducts: number = 20): string {
  const { products, categories, policies, summary } = context;

  // Chỉ lấy một số sản phẩm tiêu biểu (featured hoặc mới nhất)
  const featuredProducts = products.slice(0, maxProducts);

  const productsText =
    featuredProducts.length > 0
      ? featuredProducts
          .map(
            (p) =>
              `- ${p.name} (${p.category}): ${p.description.substring(0, 100)}... Giá: ${p.price.toLocaleString('vi-VN')}đ. ${p.inStock ? 'Còn hàng' : 'Hết hàng'}. Slug: ${p.slug} (ID: ${p.id})`
          )
          .join('\n')
      : 'Chưa có sản phẩm nào.';

  const categoriesText =
    categories.length > 0
      ? categories.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')
      : 'Chưa có danh mục nào.';

  return `# THÔNG TIN CỬA HÀNG

## Tổng quan
${summary}

## Danh mục sản phẩm
${categoriesText}

## Sản phẩm nổi bật
${productsText}

${policies}

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
 * Invalidate RAG cache (gọi khi có thay đổi products/categories)
 */
export async function invalidateRAGCache(): Promise<void> {
  await Promise.all([
    cache.del('rag:products'),
    cache.del('rag:categories'),
  ]);
}

