import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';

// GET /api/admin/customers/[id] - Get customer detail (admin only)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const { id } = await context.params;
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
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
        },
        addresses: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      );
    }

    // Calculate total spent
    const totalSpent = await prisma.order.aggregate({
      where: {
        userId: id,
        paymentStatus: 'PAID',
      },
      _sum: {
        total: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        totalSpent: totalSpent._sum.total || 0,
      },
    });
  } catch (error) {
    console.error('Admin customer detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customer',
      },
      { status: 500 }
    );
  }
}

