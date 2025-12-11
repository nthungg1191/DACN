/**
 * API Route: POST /api/orders/cleanup
 * 
 * Tự động hủy các orders PENDING đã quá thời gian giữ (expired)
 * 
 * Có thể gọi từ:
 * - Cron job (Vercel Cron, GitHub Actions, etc.)
 * - Background task
 * - Manual trigger (admin only)
 * 
 * Thời gian mặc định: 10 phút (có thể config qua env ORDER_EXPIRY_MINUTES)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { cache } from '@/lib/redis';

// Thời gian giữ order (mặc định 10 phút)
const ORDER_EXPIRY_MINUTES = parseInt(process.env.ORDER_EXPIRY_MINUTES || '10');

export async function POST(request: NextRequest) {
  try {
    // Optional: Kiểm tra admin authentication nếu cần
    // const user = await getCurrentUser();
    // if (!user || user.role !== 'ADMIN') {
    //   return createUnauthorizedResponse();
    // }

    const now = new Date();
    const expiryTime = new Date(now.getTime() - ORDER_EXPIRY_MINUTES * 60 * 1000);

    // Tìm các orders PENDING đã quá thời gian
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: {
          lt: expiryTime, // Tạo trước thời gian expiry
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired orders to cleanup',
        data: {
          expiredCount: 0,
          restoredProducts: 0,
        },
      });
    }

    // Hủy orders và restore product quantities
    let restoredProductsCount = 0;

    await prisma.$transaction(async (tx: any) => {
      for (const order of expiredOrders) {
        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            paymentMetadata: {
              cancelledAt: now.toISOString(),
              reason: 'expired',
              expiryMinutes: ORDER_EXPIRY_MINUTES,
            },
          },
        });

        // Restore product quantities
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
          restoredProductsCount += item.quantity;
        }

        // Invalidate cache for this user
        await cache.delPattern(`orders:user:${order.userId}:*`);
        await cache.del(`order:${order.id}:user:${order.userId}`);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cancelled ${expiredOrders.length} expired orders`,
      data: {
        expiredCount: expiredOrders.length,
        restoredProducts: restoredProductsCount,
        expiryMinutes: ORDER_EXPIRY_MINUTES,
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup expired orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint để check số lượng orders expired (không thực hiện cleanup)
export async function GET(request: NextRequest) {
  try {
    const ORDER_EXPIRY_MINUTES = parseInt(process.env.ORDER_EXPIRY_MINUTES || '10');
    const now = new Date();
    const expiryTime = new Date(now.getTime() - ORDER_EXPIRY_MINUTES * 60 * 1000);

    const expiredCount = await prisma.order.count({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: {
          lt: expiryTime,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        expiredCount,
        expiryMinutes: ORDER_EXPIRY_MINUTES,
        expiryTime: expiryTime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error checking expired orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check expired orders',
      },
      { status: 500 }
    );
  }
}

