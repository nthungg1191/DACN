import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { cache } from '@/lib/redis';

const paramsSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = paramsSchema.parse(params);

    // Try to get from cache first
    const cacheKey = `product:${id}`;
    const cachedData = await cache.get<any>(cacheKey);

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
        published: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            quantity: true,
            attributes: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Get related products (same category, excluding current product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        published: true,
        id: { not: product.id },
      },
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        featured: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    // Calculate average rating for related products
    const relatedProductsWithRating = relatedProducts.map((relatedProduct: any) => {
      const avgRating = relatedProduct.reviews.length > 0
        ? relatedProduct.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / relatedProduct.reviews.length
        : 0;

      return {
        ...relatedProduct,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: relatedProduct._count.reviews,
      };
    });

    const productWithRating = {
      ...product,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: product._count.reviews,
      relatedProducts: relatedProductsWithRating,
    };

    // Cache the result for 10 minutes (600 seconds)
    await cache.set(cacheKey, productWithRating, 600);

    return NextResponse.json({
      success: true,
      data: productWithRating,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
