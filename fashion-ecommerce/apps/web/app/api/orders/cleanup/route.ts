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
import { getSettings } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    // Optional: Kiểm tra admin authentication nếu cần
    // const user = await getCurrentUser();
    // if (!user || user.role !== 'ADMIN') {
    //   return createUnauthorizedResponse();
    // }

    const settings = await getSettings();
    const now = new Date();
    const expiryTime = new Date(now.getTime() - settings.orderExpiryMinutes * 60 * 1000);

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

    await prisma.$transaction(async (tx) => {
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
              expiryMinutes: settings.orderExpiryMinutes,
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

    // Tự động chuyển các đơn đã giao hàng sang đã nhận hàng sau 7 ngày
    const autoNow = new Date();
    const sevenDaysAgo = new Date(autoNow.getTime() - 7 * 24 * 60 * 60 * 1000);

    const autoReceivedOrders = await prisma.order.updateMany({
      where: {
        status: 'DELIVERED',
        OR: [
          {
            deliveredAt: {
              lte: sevenDaysAgo,
            },
          },
          {
            deliveredAt: null,
            updatedAt: {
              lte: sevenDaysAgo,
            },
          },
        ],
      },
      data: {
        status: 'RECEIVED',
        receivedAt: autoNow,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cancelled ${expiredOrders.length} expired orders and auto-completed ${autoReceivedOrders.count} delivered orders`,
      data: {
        expiredCount: expiredOrders.length,
        restoredProducts: restoredProductsCount,
        expiryMinutes: settings.orderExpiryMinutes,
        autoReceivedCount: autoReceivedOrders.count,
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
    const settings = await getSettings();
    const now = new Date();
    const expiryTime = new Date(now.getTime() - settings.orderExpiryMinutes * 60 * 1000);

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
        expiryMinutes: settings.orderExpiryMinutes,
        expiryTime: expiryTime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Lỗi kiểm tra số lượng orders expired:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi kiểm tra số lượng orders expired',
      },
      { status: 500 }
    );
  }
}

