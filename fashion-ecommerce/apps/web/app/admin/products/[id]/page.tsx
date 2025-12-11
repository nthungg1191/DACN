import { requireAdmin } from '@/lib/auth-server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@repo/database';
import { 
  Package, 
  DollarSign, 
  Star, 
  ShoppingCart, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { ProductActionsClient } from '../../../../components/admin/products/ProductActionsClient';

async function getProductDetail(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          orderBy: { createdAt: 'asc' },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) return null;

    // Calculate statistics
    const orderItems = await prisma.orderItem.findMany({
      where: { productId },
      include: {
        order: {
          select: {
            paymentStatus: true,
            total: true,
          },
        },
      },
    });

    const totalRevenue = orderItems
      .filter((item: any) => item.order.paymentStatus === 'PAID')
      .reduce((sum: number, item: any) => sum + item.total.toNumber(), 0);

    const totalOrders = orderItems.length;
    const totalQuantitySold = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

    // Calculate isOnSale and isNew automatically
    const price = product.price.toNumber();
    const comparePrice = product.comparePrice?.toNumber() || null;
    const isOnSale = comparePrice !== null && comparePrice > price;
    
    // isNew: product created within last 30 days
    const daysSinceCreation = Math.floor(
      (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isNew = daysSinceCreation <= 30;

    // Serialize Decimal fields
    return {
      ...product,
      price,
      comparePrice,
      costPrice: product.costPrice?.toNumber() || null,
      variants: product.variants.map((v: any) => ({
        ...v,
        price: v.price.toNumber(),
      })),
      statistics: {
        totalRevenue,
        totalOrders,
        totalQuantitySold,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: product._count.reviews,
      },
      isOnSale,
      isNew,
    };
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return null;
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default async function AdminProductDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    const { id } = await paramsPromise;
    redirect(`/admin/login?callbackUrl=/admin/products/${id}`);
  }

  const { id } = await paramsPromise;

  const product = await getProductDetail(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Quay lại danh sách sản phẩm
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                product.published
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {product.published ? 'Đã xuất bản' : 'Bản nháp'}
            </span>
            {product.featured && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                Nổi bật
              </span>
            )}
            {product.isNew && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                Mới
              </span>
            )}
            {product.isOnSale && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                Đang giảm giá
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Sửa sản phẩm
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh sản phẩm</h2>
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image: string, index: number) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Chưa có hình ảnh</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sản phẩm</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tên sản phẩm</label>
                <p className="text-base text-gray-900 mt-1">{product.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Slug</label>
                <p className="text-base text-gray-900 mt-1 font-mono text-sm">{product.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Danh mục</label>
                <p className="text-base text-gray-900 mt-1">
                  <Link
                    href={`/admin/categories/${product.category.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {product.category.name}
                  </Link>
                </p>
              </div>
              {product.brand && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Thương hiệu</label>
                  <p className="text-base text-gray-900 mt-1">{product.brand}</p>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Thẻ</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                <p className="text-base text-gray-700 mt-1 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Giá cả & Tồn kho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Giá bán</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </div>
                {product.comparePrice && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Giá so sánh</label>
                    <p className="text-base text-gray-500 line-through mt-1">
                      {formatCurrency(product.comparePrice)}
                    </p>
                  </div>
                )}
                {product.costPrice && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Giá vốn</label>
                    <p className="text-base text-gray-700 mt-1">
                      {formatCurrency(product.costPrice)}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">SKU</label>
                  <p className="text-base text-gray-900 mt-1 font-mono">{product.sku}</p>
                </div>
                {product.barcode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Barcode</label>
                    <p className="text-base text-gray-900 mt-1 font-mono">{product.barcode}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Số lượng tồn kho</label>
                  <p className={`text-lg font-semibold mt-1 ${
                    product.quantity > 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {product.quantity}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Biến thể sản phẩm</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Giá
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Thuộc tính
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {product.variants.map((variant: any) => (
                      <tr key={variant.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{variant.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {variant.sku}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatCurrency(variant.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{variant.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {typeof variant.attributes === 'object'
                            ? JSON.stringify(variant.attributes)
                            : variant.attributes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Đánh giá gần đây</h2>
                <Link
                  href={`/products/${product.id}?tab=reviews`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-4">
                {product.reviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {review.user?.image ? (
                          <img
                            src={review.user.image}
                            alt={review.user.name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm">
                            {(review.user?.name || 'U')?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {review.user?.name || 'Khách hàng'}
                          </p>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Doanh thu</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(product.statistics.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đơn hàng</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {product.statistics.totalOrders}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đã bán</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {product.statistics.totalQuantitySold}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đánh giá</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">
                        {product.statistics.averageRating}
                      </p>
                      <p className="text-sm text-gray-500">
                        ({product.statistics.totalReviews} đánh giá)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <ProductActionsClient productId={product.id} />

          {/* Product Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Xuất bản</span>
                {product.published ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sản phẩm nổi bật</span>
                {product.featured ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sản phẩm mới</span>
                {product.isNew ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Đang giảm giá</span>
                {product.isOnSale ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Ngày tạo: {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cập nhật: {new Date(product.updatedAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

