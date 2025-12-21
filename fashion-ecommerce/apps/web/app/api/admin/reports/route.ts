import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin } from '@/lib/auth-server';

type Period = 'day' | 'week' | 'month' | 'year';

/**
 * GET /api/admin/reports
 * Get comprehensive reports data with filters
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'month') as Period;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');

    // Calculate date range based on period
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;

    switch (period) {
      case 'day':
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 7); // Last 7 days
        break;
      case 'week':
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 30); // Last 30 days
        break;
      case 'month':
        dateFrom = new Date(now);
        dateFrom.setMonth(dateFrom.getMonth() - 12); // Last 12 months
        break;
      case 'year':
        dateFrom = new Date(now);
        dateFrom.setFullYear(dateFrom.getFullYear() - 5); // Last 5 years
        break;
      default:
        dateFrom = new Date(now);
        dateFrom.setMonth(dateFrom.getMonth() - 12);
    }

    // Override with custom date range if provided
    if (startDate) dateFrom = new Date(startDate);
    if (endDate) dateTo = new Date(endDate);

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      paymentStatus: 'PAID', // Only count paid orders for revenue
    };

    // Add category filter if provided
    if (categoryId) {
      whereClause.items = {
        some: {
          product: {
            categoryId,
          },
        },
      };
    }

    // 1. Revenue over time
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group revenue by time period
    const revenueByPeriod: Record<string, number> = {};
    const ordersByPeriod: Record<string, number> = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      let key: string;

      switch (period) {
        case 'day':
          key = orderDate.toLocaleDateString('vi-VN');
          break;
        case 'week':
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          key = `Tuần ${weekStart.toLocaleDateString('vi-VN')}`;
          break;
        case 'month':
          key = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
          break;
        case 'year':
          key = orderDate.getFullYear().toString();
          break;
        default:
          key = orderDate.toLocaleDateString('vi-VN');
      }

      const total = typeof order.total === 'object' && 'toNumber' in order.total
        ? order.total.toNumber()
        : Number(order.total);

      revenueByPeriod[key] = (revenueByPeriod[key] || 0) + total;
      ordersByPeriod[key] = (ordersByPeriod[key] || 0) + 1;
    });

    // Convert to array format for charts
    const revenueChartData = Object.entries(revenueByPeriod)
      .map(([date, revenue]) => ({
        date,
        revenue: Number(revenue),
        orders: ordersByPeriod[date] || 0,
      }))
      .sort((a, b) => {
        // Sort by date
        if (period === 'month' || period === 'year') {
          return a.date.localeCompare(b.date);
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    // 2. Top selling products
    const productSales: Record<string, {
      productId: string;
      productName: string;
      categoryName: string;
      revenue: number;
      quantity: number;
      orders: number;
    }> = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product.id;
        const price = typeof item.price === 'object' && 'toNumber' in item.price
          ? item.price.toNumber()
          : Number(item.price);

        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            productName: item.product.name,
            categoryName: item.product.category?.name || 'Không có danh mục',
            revenue: 0,
            quantity: 0,
            orders: 0,
          };
        }

        productSales[productId].revenue += price * item.quantity;
        productSales[productId].quantity += item.quantity;
        productSales[productId].orders += 1;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 3. Revenue by category
    const categoryRevenue: Record<string, {
      categoryId: string;
      categoryName: string;
      revenue: number;
      orders: Set<string>;
      products: Set<string>;
    }> = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryId = item.product.categoryId || 'uncategorized';
        const categoryName = item.product.category?.name || 'Không có danh mục';
        
        if (!categoryRevenue[categoryId]) {
          categoryRevenue[categoryId] = {
            categoryId,
            categoryName,
            revenue: 0,
            orders: new Set<string>(),
            products: new Set<string>(),
          };
        }

        const price = typeof item.price === 'object' && 'toNumber' in item.price
          ? item.price.toNumber()
          : Number(item.price);

        categoryRevenue[categoryId].revenue += price * item.quantity;
        categoryRevenue[categoryId].products.add(item.product.id);
        categoryRevenue[categoryId].orders.add(order.id);
      });
    });

    const revenueByCategory = Object.values(categoryRevenue)
      .map((cat) => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        revenue: cat.revenue,
        orders: cat.orders.size,
        products: cat.products.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 4. Summary statistics
    const totalRevenue = orders.reduce((sum, order) => {
      const total = typeof order.total === 'object' && 'toNumber' in order.total
        ? order.total.toNumber()
        : Number(order.total);
      return sum + total;
    }, 0);

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItemsSold = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // 5. Compare with previous period
    const previousPeriodStart = new Date(dateFrom);
    const previousPeriodEnd = new Date(dateFrom);
    const periodDuration = dateTo.getTime() - dateFrom.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);
    previousPeriodEnd.setTime(dateFrom.getTime() - 1);

    const previousOrders = await prisma.order.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
      select: {
        total: true,
      },
    });

    const previousRevenue = previousOrders.reduce((sum, order) => {
      const total = typeof order.total === 'object' && 'toNumber' in order.total
        ? order.total.toNumber()
        : Number(order.total);
      return sum + total;
    }, 0);

    const revenueChange = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const ordersChange = previousOrders.length > 0
      ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100
      : 0;

    // 6. Customer Analysis
    // Get all customers who made orders in the period
    const customerOrders = await prisma.order.findMany({
      where: {
        ...whereClause,
      },
      select: {
        userId: true,
        total: true,
        createdAt: true,
        id: true,
      },
    });

    // Group customers by registration date
    const newCustomers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group new customers by time period
    const newCustomersByPeriod: Record<string, number> = {};
    newCustomers.forEach((customer) => {
      const customerDate = new Date(customer.createdAt);
      let key: string;

      switch (period) {
        case 'day':
          key = customerDate.toLocaleDateString('vi-VN');
          break;
        case 'week':
          const weekStart = new Date(customerDate);
          weekStart.setDate(customerDate.getDate() - customerDate.getDay());
          key = `Tuần ${weekStart.toLocaleDateString('vi-VN')}`;
          break;
        case 'month':
          key = `${customerDate.getMonth() + 1}/${customerDate.getFullYear()}`;
          break;
        case 'year':
          key = customerDate.getFullYear().toString();
          break;
        default:
          key = customerDate.toLocaleDateString('vi-VN');
      }

      newCustomersByPeriod[key] = (newCustomersByPeriod[key] || 0) + 1;
    });

    const newCustomersChart = Object.entries(newCustomersByPeriod)
      .map(([date, count]) => ({
        date,
        count: Number(count),
      }))
      .sort((a, b) => {
        if (period === 'month' || period === 'year') {
          return a.date.localeCompare(b.date);
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    // Calculate customer spending
    const customerSpending: Record<string, {
      userId: string;
      userName: string;
      userEmail: string;
      totalSpent: number;
      orderCount: number;
      averageOrderValue: number;
      firstOrderDate: Date;
      lastOrderDate: Date;
    }> = {};

    customerOrders.forEach((order) => {
      if (!order.userId) return;

      const total = typeof order.total === 'object' && 'toNumber' in order.total
        ? order.total.toNumber()
        : Number(order.total);

      if (!customerSpending[order.userId]) {
        customerSpending[order.userId] = {
          userId: order.userId,
          userName: '',
          userEmail: '',
          totalSpent: 0,
          orderCount: 0,
          averageOrderValue: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
        };
      }

      customerSpending[order.userId].totalSpent += total;
      customerSpending[order.userId].orderCount += 1;
      
      if (order.createdAt < customerSpending[order.userId].firstOrderDate) {
        customerSpending[order.userId].firstOrderDate = order.createdAt;
      }
      if (order.createdAt > customerSpending[order.userId].lastOrderDate) {
        customerSpending[order.userId].lastOrderDate = order.createdAt;
      }
    });

    // Get user details for top customers
    const userIds = Object.keys(customerSpending);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Update customer spending with user details and calculate averages
    const topCustomers = Object.values(customerSpending)
      .map((customer) => {
        const user = userMap.get(customer.userId);
        return {
          ...customer,
          userName: user?.name || 'Khách hàng',
          userEmail: user?.email || '',
          averageOrderValue: customer.orderCount > 0 
            ? customer.totalSpent / customer.orderCount 
            : 0,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Calculate repeat customer rate
    const uniqueCustomers = new Set(customerOrders.map(o => o.userId).filter(Boolean));
    const repeatCustomers = Array.from(uniqueCustomers).filter(userId => {
      const customerOrdersCount = customerOrders.filter(o => o.userId === userId).length;
      return customerOrdersCount > 1;
    });

    const repeatCustomerRate = uniqueCustomers.size > 0
      ? (repeatCustomers.length / uniqueCustomers.size) * 100
      : 0;

    // Calculate average order value per customer
    const averageOrderValuePerCustomer = uniqueCustomers.size > 0
      ? totalRevenue / uniqueCustomers.size
      : 0;

    // Compare with previous period for customers
    const previousNewCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    });

    const newCustomersChange = previousNewCustomers > 0
      ? ((newCustomers.length - previousNewCustomers) / previousNewCustomers) * 100
      : 0;

    // 7. Reviews & Ratings Analysis
    const reviews = await prisma.review.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Overall rating statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Rating distribution (1-5 stars)
    const ratingDistribution = [1, 2, 3, 4, 5].reduce<Record<number, number>>(
      (acc, rating) => {
        acc[rating] = reviews.filter(r => r.rating === rating).length;
        return acc;
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    );

    // Products with most reviews
    const productReviewStats: Record<string, {
      productId: string;
      productName: string;
      categoryName: string;
      totalReviews: number;
      averageRating: number;
      ratingDistribution: Record<number, number>;
    }> = {};

    reviews.forEach((review) => {
      const productId = review.productId;
      if (!productReviewStats[productId]) {
        productReviewStats[productId] = {
          productId,
          productName: review.product.name,
          categoryName: review.product.category?.name || 'Không có danh mục',
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      productReviewStats[productId].totalReviews += 1;
      productReviewStats[productId].ratingDistribution[review.rating] += 1;
    });

    // Calculate average rating for each product
    Object.values(productReviewStats).forEach((product) => {
      const totalRating = Object.entries(product.ratingDistribution).reduce(
        (sum, [rating, count]) => sum + Number(rating) * count,
        0
      );
      product.averageRating = product.totalReviews > 0
        ? totalRating / product.totalReviews
        : 0;
    });

    // Top products by review count
    const topReviewedProducts = Object.values(productReviewStats)
      .sort((a, b) => b.totalReviews - a.totalReviews)
      .slice(0, 10);

    // Products with lowest ratings (average rating < 3.0 and at least 3 reviews)
    const lowRatedProducts = Object.values(productReviewStats)
      .filter(p => p.averageRating < 3.0 && p.totalReviews >= 3)
      .sort((a, b) => a.averageRating - b.averageRating)
      .slice(0, 10);

    // Compare with previous period
    const previousReviews = await prisma.review.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    });

    const reviewsChange = previousReviews > 0
      ? ((totalReviews - previousReviews) / previousReviews) * 100
      : 0;

    // 8. Orders Statistics Analysis
    const allOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Orders by status
    const ordersByStatus = allOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Cancellation rate
    const cancelledOrders = allOrders.filter(o => o.status === 'CANCELLED').length;
    const cancellationRate = allOrders.length > 0
      ? (cancelledOrders / allOrders.length) * 100
      : 0;

    // Average processing time (from PENDING to DELIVERED)
    const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED');
    const processingTimes: number[] = [];
    
    deliveredOrders.forEach((order) => {
      const processingTime = order.updatedAt.getTime() - order.createdAt.getTime();
      processingTimes.push(processingTime);
    });

    const averageProcessingTimeMs = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    // Convert to hours
    const averageProcessingTimeHours = averageProcessingTimeMs / (1000 * 60 * 60);

    // Orders by hour of day
    const ordersByHour: Record<number, number> = {};
    allOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
    });

    const ordersByHourChart = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: ordersByHour[i] || 0,
    }));

    // Conversion rate (orders / customers who visited)
    // For now, we'll use a simple calculation based on orders
    const conversionRate = uniqueCustomers.size > 0
      ? (allOrders.length / uniqueCustomers.size) * 100
      : 0;

    // 9. Customer Behavior Analysis (Wishlist & Conversion + Views & Search)
    const wishlists = await prisma.wishlist.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        userId: true,
        productId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const totalWishlistAdds = wishlists.length;
    const uniqueWishlistUsers = new Set(wishlists.map((w) => w.userId)).size;

    const wishlistByProduct: Record<
      string,
      {
        productId: string;
        productName: string;
        categoryName: string;
        wishlistCount: number;
      }
    > = {};

    wishlists.forEach((w) => {
      const productId = w.productId;
      if (!wishlistByProduct[productId]) {
        wishlistByProduct[productId] = {
          productId,
          productName: w.product.name,
          categoryName: w.product.category?.name || 'Không có danh mục',
          wishlistCount: 0,
        };
      }
      wishlistByProduct[productId].wishlistCount += 1;
    });

    const topWishlistedProducts = Object.values(wishlistByProduct)
      .sort((a, b) => b.wishlistCount - a.wishlistCount)
      .slice(0, 10);

    // Orders that include products which were wishlisted in this period
    const wishlistProductIds = Object.keys(wishlistByProduct);

    let totalWishlistPurchases = 0;
    let wishlistConversionRate = 0;

    if (wishlistProductIds.length > 0) {
      const wishlistOrderItems = await prisma.orderItem.findMany({
        where: {
          productId: { in: wishlistProductIds },
          order: {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
            paymentStatus: 'PAID',
          },
        },
        select: {
          productId: true,
        },
      });

      totalWishlistPurchases = wishlistOrderItems.length;

      wishlistConversionRate =
        totalWishlistAdds > 0
          ? (totalWishlistPurchases / totalWishlistAdds) * 100
          : 0;
    }

    // Product views analysis
    const productViews = await (prisma as any).productView.groupBy({
      by: ['productId'],
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: 10,
    });

    const topViewedProducts = await prisma.product.findMany({
      where: {
        id: { in: (productViews as any[]).map((v: any) => v.productId) },
      },
      select: {
        id: true,
        name: true,
        category: {
          select: { name: true },
        },
      },
    });

    const topViewedProductsWithCounts = (productViews as any[]).map((view) => {
      const product = topViewedProducts.find((p: any) => p.id === view.productId);
      return {
        productId: view.productId,
        productName: product?.name || 'Sản phẩm không tồn tại',
        categoryName: product?.category?.name || 'Không có danh mục',
        viewCount: view._count.productId,
      };
    });

    // Search keyword analysis
    const topSearchKeywords = await (prisma as any).searchQuery.groupBy({
      by: ['query'],
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _count: {
        query: true,
      },
      _avg: {
        resultsCount: true,
      },
      orderBy: {
        _count: {
          query: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalItemsSold,
          revenueChange,
          ordersChange,
        },
        revenueChart: revenueChartData,
        topProducts,
        revenueByCategory,
        customerAnalysis: {
          newCustomersChart,
          topCustomers,
          repeatCustomerRate,
          averageOrderValuePerCustomer,
          totalCustomers: uniqueCustomers.size,
          newCustomers: newCustomers.length,
          newCustomersChange,
        },
        reviewsAnalysis: {
          totalReviews,
          averageRating,
          ratingDistribution,
          topReviewedProducts,
          lowRatedProducts,
          reviewsChange,
        },
        ordersAnalysis: {
          ordersByStatus,
          cancellationRate,
          averageProcessingTimeHours,
          ordersByHourChart,
          conversionRate,
          totalOrders: allOrders.length,
          cancelledOrders,
          deliveredOrders: deliveredOrders.length,
        },
        behaviorAnalysis: {
          totalWishlistAdds,
          uniqueWishlistUsers,
          topWishlistedProducts,
          totalWishlistPurchases,
          wishlistConversionRate,
          topViewedProducts: topViewedProductsWithCounts,
          topSearchKeywords: (topSearchKeywords as any[]).map((k: any) => ({
            query: k.query,
            count: k._count.query,
            averageResults: k._avg.resultsCount ?? 0,
          })),
        },
        period,
        dateRange: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reports',
      },
      { status: 500 }
    );
  }
}

