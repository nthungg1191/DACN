import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

// GET /api/products/:id/reviews - list reviews + stats
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : Number(
            (
              reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
            ).toFixed(1)
          );

    const ratingDistribution = [1, 2, 3, 4, 5].reduce<Record<number, number>>(
      (acc, rating) => {
        acc[rating] = reviews.filter((r) => r.rating === rating).length;
        return acc;
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          user: {
            id: r.user.id,
            name: r.user.name || r.user.email || 'Người dùng',
          },
        })),
        stats: {
          totalReviews,
          averageRating,
          ratingDistribution,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/products/:id/reviews - create review (requires purchased & delivered)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { id: productId } = await context.params;
    const body = await request.json();
    const parsed = createReviewSchema.parse(body);

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user has an order containing this product and đã giao xong
    const hasOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'DELIVERED', // hiện schema chỉ có DELIVERED (không có COMPLETED)
        items: { some: { productId } },
      },
      select: { id: true },
    });

    // NOTE: Trước đây chỉ cho phép khi đã DELIVERED.
    // Để tránh chặn người dùng (nhất là dữ liệu demo), cho phép nếu đã từng mua sản phẩm (bất kỳ trạng thái).
    if (!hasOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn cần đã nhận hàng để đánh giá sản phẩm này.',
        },
        { status: 400 }
      );
    }

    // Prevent duplicate review by same user for same product
    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id, productId },
      select: { id: true },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã đánh giá sản phẩm này.' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: parsed.rating,
        comment: parsed.comment || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          name: review.user.name || review.user.email || 'Người dùng',
        },
      },
      message: 'Đã gửi đánh giá thành công',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

