import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';

// GET /api/admin/customers - Get all customers (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');

    const where: any = {
      role: 'CUSTOMER',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer:any) => {
        const totalSpent = await prisma.order.aggregate({
          where: {
            userId: customer.id,
            paymentStatus: 'PAID',
          },
          _sum: {
            total: true,
          },
        });

        return {
          ...customer,
          totalSpent: totalSpent._sum.total || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: customersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin customers API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customers',
      },
      { status: 500 }
    );
  }
}

