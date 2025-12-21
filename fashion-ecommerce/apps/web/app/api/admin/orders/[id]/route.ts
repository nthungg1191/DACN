import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { cache } from '@/lib/redis';

// GET /api/admin/orders/[id] - Get order detail (admin only)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    try {
      await requireAdmin();
    } catch (error) {
      return createForbiddenResponse();
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
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
                slug: true,
                images: true,
                price: true,
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

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Admin order detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/[id] - Update order (admin only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    try {
      await requireAdmin();
    } catch (error) {
      return createForbiddenResponse();
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
      notes: z.string().optional(),
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

    // Check if order exists
    const { id } = await context.params;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
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

    // Admin can update any status (no restrictions)
    const now = new Date();
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(parsedData.status && { status: parsedData.status as any }),
        ...(parsedData.paymentStatus && { paymentStatus: parsedData.paymentStatus }),
        ...(parsedData.notes && { notes: parsedData.notes }),
        ...(parsedData.status === 'DELIVERED' && existingOrder.status !== 'DELIVERED' && {
          deliveredAt: now,
        }),
        ...(parsedData.status === 'RECEIVED' && (existingOrder.status as any) !== 'RECEIVED' && {
          receivedAt: now,
        }),
      },
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
    });

    // If order is cancelled, restore product quantities
    if (parsedData.status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      await prisma.$transaction(
        (updatedOrder as any).items.map((item: any) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          })
        )
      );
    }

    // Invalidate user caches related to this order
    try {
      await cache.delPattern(`orders:user:${existingOrder.userId}:*`);
      await cache.del(`order:${id}:user:${existingOrder.userId}`);
    } catch (cacheError) {
      console.error('Failed to invalidate user order cache from admin API:', cacheError);
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Admin order update API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order',
      },
      { status: 500 }
    );
  }
}

