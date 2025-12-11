import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';

// GET /api/admin/analytics - Get analytics data (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // Sales statistics
    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      ordersByStatus,
      topProducts,
      revenueByDate,
    ] = await Promise.all([
      // Total revenue
      prisma.order.aggregate({
        where: {
          ...dateFilter,
          paymentStatus: 'PAID',
        },
        _sum: {
          total: true,
        },
      }),
      // Total orders
      prisma.order.count({
        where: dateFilter,
      }),
      // Total customers
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: new Date(startDate) } : {}),
                  ...(endDate ? { lte: new Date(endDate) } : {}),
                },
              }
            : {}),
        },
      }),
      // Average order value
      prisma.order.aggregate({
        where: {
          ...dateFilter,
          paymentStatus: 'PAID',
        },
        _avg: {
          total: true,
        },
      }),
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: {
          id: true,
        },
      }),
      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            ...dateFilter,
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
      // Revenue by date (last 30 days)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(total) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE payment_status = 'PAID'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            images: true,
          },
        });
        return {
          product,
          quantity: item._sum.quantity || 0,
          revenue: item._sum.total || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        totalCustomers,
        averageOrderValue: averageOrderValue._avg.total || 0,
        ordersByStatus: ordersByStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        topProducts: topProductsWithDetails,
        revenueByDate,
      },
    });
  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}

