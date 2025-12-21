import { requireAdmin } from '@/lib/auth-server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@repo/database';
import { OrderDetailClient } from '@/components/admin/orders/OrderDetailClient';

async function getOrderDetail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) return null;

    // Serialize Decimal fields to numbers for Client Component
    const orderWithDiscount = order as typeof order & { discount?: any };
    return {
      ...order,
      subtotal: order.subtotal.toNumber(),
      discount: orderWithDiscount.discount ? (typeof orderWithDiscount.discount === 'object' && 'toNumber' in orderWithDiscount.discount
        ? orderWithDiscount.discount.toNumber()
        : Number(orderWithDiscount.discount)) : 0,
      tax: order.tax.toNumber(),
      shipping: order.shipping.toNumber(),
      total: order.total.toNumber(),
      items: order.items.map((item) => ({
        ...item,
        price: item.price.toNumber(),
        total: item.total.toNumber(),
        product: item.product
          ? {
              ...item.product,
              price: item.product.price.toNumber(),
            }
          : null,
      })),
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return null;
  }
}

export default async function AdminOrderDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/orders');
  }

  const { id } = await paramsPromise;

  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Quay lại danh sách đơn hàng
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
          <p className="text-gray-600 mt-1">Mã đơn: {order.orderNumber}</p>
        </div>
      </div>

      {/* Order Detail Client Component */}
      <OrderDetailClient order={order} />
    </div>
  );
}

