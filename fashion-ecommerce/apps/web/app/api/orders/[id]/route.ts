import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { cache } from '@/lib/redis';
import { z } from 'zod';

// GET /api/orders/[id] - Get order by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Check cache
    const { id } = await context.params;

    const cacheKey = `order:${id}:user:${user.id}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      // Parse cached data if it's a string
      const cachedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return NextResponse.json({
        success: true,
        data: cachedData,
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Serialize order data - convert Prisma Decimal to number
    const serializedOrder = {
      ...order,
      subtotal: typeof order.subtotal === 'object' && 'toNumber' in order.subtotal
        ? order.subtotal.toNumber()
        : Number(order.subtotal),
      discount: typeof order.discount === 'object' && 'toNumber' in order.discount
        ? order.discount.toNumber()
        : Number(order.discount || 0),
      tax: typeof order.tax === 'object' && 'toNumber' in order.tax
        ? order.tax.toNumber()
        : Number(order.tax),
      shipping: typeof order.shipping === 'object' && 'toNumber' in order.shipping
        ? order.shipping.toNumber()
        : Number(order.shipping),
      total: typeof order.total === 'object' && 'toNumber' in order.total
        ? order.total.toNumber()
        : Number(order.total),
      items: order.items.map((item: any) => ({
        ...item,
        price: typeof item.price === 'object' && 'toNumber' in item.price
          ? item.price.toNumber()
          : Number(item.price),
        total: typeof item.total === 'object' && 'toNumber' in item.total
          ? item.total.toNumber()
          : Number(item.total),
        product: item.product ? {
          ...item.product,
          price: typeof item.product.price === 'object' && 'toNumber' in item.product.price
            ? item.product.price.toNumber()
            : Number(item.product.price),
        } : null,
      })),
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
      deliveredAt: order.deliveredAt instanceof Date ? order.deliveredAt.toISOString() : order.deliveredAt,
      receivedAt: order.receivedAt instanceof Date ? order.receivedAt.toISOString() : order.receivedAt,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(serializedOrder), 5 * 60);

    return NextResponse.json({
      success: true,
      data: serializedOrder,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    
    const updateSchema = z.object({
      status: z
        .enum([
          'PENDING',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'RECEIVED',
          'RETURN_REQUESTED',
          'CANCELLED',
        ])
        .optional(),
      paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
      returnReason: z.string().optional(),
    });

    let parsedData;
    try {
      parsedData = updateSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if order exists and belongs to user
    const { id } = await context.params;

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Validate status transitions
    if (parsedData.status) {
      // Only allow canceling PENDING orders
      if (parsedData.status === 'CANCELLED' && existingOrder.status !== 'PENDING') {
        return NextResponse.json(
          {
            success: false,
            error: 'Chỉ có thể hủy đơn hàng đang ở trạng thái "Chờ xử lý"',
          },
          { status: 400 }
        );
      }
      
      // Only allow user to confirm RECEIVED from DELIVERED within 7 days
      if (parsedData.status === 'RECEIVED') {
        if (existingOrder.status !== 'DELIVERED') {
          return NextResponse.json(
            {
              success: false,
              error: 'Chỉ có thể xác nhận đã nhận hàng khi đơn đang ở trạng thái "Đã giao hàng"',
            },
            { status: 400 }
          );
        }

        const deliveredAt = existingOrder.deliveredAt || existingOrder.updatedAt;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (deliveredAt && new Date().getTime() - new Date(deliveredAt).getTime() > sevenDaysMs) {
          return NextResponse.json(
            {
              success: false,
              error: 'Đơn hàng đã quá thời gian xác nhận nhận hàng',
            },
            { status: 400 }
          );
        }
      }

      // Allow requesting return only within 7 days after delivery and before RECEIVED
      if (parsedData.status === 'RETURN_REQUESTED') {
        if (existingOrder.status !== 'DELIVERED') {
          return NextResponse.json(
            {
              success: false,
              error: 'Chỉ có thể yêu cầu hoàn hàng khi đơn đang ở trạng thái "Đã giao hàng"',
            },
            { status: 400 }
          );
        }

        const deliveredAt = existingOrder.deliveredAt || existingOrder.updatedAt;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (!deliveredAt || new Date().getTime() - new Date(deliveredAt).getTime() > sevenDaysMs) {
          return NextResponse.json(
            {
              success: false,
              error: 'Đơn hàng đã quá thời gian cho phép hoàn hàng (7 ngày)',
            },
            { status: 400 }
          );
        }
      }

      // Don't allow going backwards (the main forward flow)
      const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RECEIVED', 'RETURN_REQUESTED'];
      const currentIndex = statusOrder.indexOf(existingOrder.status);
      const newIndex = statusOrder.indexOf(parsedData.status);
      
      if (newIndex < currentIndex && parsedData.status !== 'CANCELLED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Không thể chuyển đơn hàng về trạng thái trước đó',
          },
          { status: 400 }
        );
      }
    }

    // Update order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const updated = await tx.order.update({
        where: {
          id,
        },
        data: {
          ...(parsedData.status && { status: parsedData.status }),
          ...(parsedData.paymentStatus && { paymentStatus: parsedData.paymentStatus }),
          ...(parsedData.status === 'DELIVERED' && existingOrder.status !== 'DELIVERED' && {
            deliveredAt: now,
          }),
          ...(parsedData.status === 'RECEIVED' && existingOrder.status !== 'RECEIVED' && {
            receivedAt: now,
          }),
          ...(parsedData.status === 'RETURN_REQUESTED' && parsedData.returnReason && {
            notes:
              (existingOrder.notes ? `${existingOrder.notes}\n` : '') +
              `[Yêu cầu hoàn hàng] ${parsedData.returnReason}`,
          }),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  price: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      // If order is cancelled, restore product quantities
      if (parsedData.status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
        for (const item of updated.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return updated;
    });

    // Serialize updated order data
    const serializedOrder = {
      ...updatedOrder,
      subtotal: typeof updatedOrder.subtotal === 'object' && 'toNumber' in updatedOrder.subtotal
        ? updatedOrder.subtotal.toNumber()
        : Number(updatedOrder.subtotal),
      discount: typeof updatedOrder.discount === 'object' && 'toNumber' in updatedOrder.discount
        ? updatedOrder.discount.toNumber()
        : Number(updatedOrder.discount || 0),
      tax: typeof updatedOrder.tax === 'object' && 'toNumber' in updatedOrder.tax
        ? updatedOrder.tax.toNumber()
        : Number(updatedOrder.tax),
      shipping: typeof updatedOrder.shipping === 'object' && 'toNumber' in updatedOrder.shipping
        ? updatedOrder.shipping.toNumber()
        : Number(updatedOrder.shipping),
      total: typeof updatedOrder.total === 'object' && 'toNumber' in updatedOrder.total
        ? updatedOrder.total.toNumber()
        : Number(updatedOrder.total),
      items: updatedOrder.items.map((item: any) => ({
        ...item,
        price: typeof item.price === 'object' && 'toNumber' in item.price
          ? item.price.toNumber()
          : Number(item.price),
        total: typeof item.total === 'object' && 'toNumber' in item.total
          ? item.total.toNumber()
          : Number(item.total),
        product: item.product ? {
          ...item.product,
          price: typeof item.product.price === 'object' && 'toNumber' in item.product.price
            ? item.product.price.toNumber()
            : Number(item.product.price),
        } : null,
      })),
      createdAt: updatedOrder.createdAt instanceof Date ? updatedOrder.createdAt.toISOString() : updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt instanceof Date ? updatedOrder.updatedAt.toISOString() : updatedOrder.updatedAt,
    };

    // Invalidate cache
    await cache.delPattern(`orders:user:${user.id}:*`);
    await cache.del(`order:${id}:user:${user.id}`);

    return NextResponse.json({
      success: true,
      data: serializedOrder,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

