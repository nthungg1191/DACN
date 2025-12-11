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
      return NextResponse.json({
        success: true,
        data: cached,
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

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(order), 5 * 60);

    return NextResponse.json({
      success: true,
      data: order,
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
      status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
      paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
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

      // Don't allow going backwards
      const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
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
    const updatedOrder = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({
        where: {
          id,
        },
        data: {
          ...(parsedData.status && { status: parsedData.status }),
          ...(parsedData.paymentStatus && { paymentStatus: parsedData.paymentStatus }),
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

    // Invalidate cache
    await cache.delPattern(`orders:user:${user.id}:*`);
    await cache.del(`order:${id}:user:${user.id}`);

    return NextResponse.json({
      success: true,
      data: updatedOrder,
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

