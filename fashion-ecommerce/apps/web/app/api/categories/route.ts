import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { cache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const limit = searchParams.get('limit');

    // Generate cache key
    const cacheKey = `categories:${includeProducts ? 'with-products' : 'list'}:${limit || 'all'}`;
    
    // Try to get from cache first
    const cachedData = await cache.get<any[]>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
      });
    }

    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // Only get root categories
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        children: {
          include: {
            _count: {
              select: {
                products: true,
              },
            },
            children: {
              include: {
                _count: {
                  select: {
                    products: true,
                  },
                },
              },
            },
          },
        },
        ...(includeProducts && {
          products: {
            where: {
              published: true,
            },
            take: limit ? parseInt(limit) : 8,
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
          },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate average rating for products if included
    type ProductWithMeta = {
      id: string;
      name: string;
      slug: string;
      price: any;
      images: string[];
      featured: boolean;
      reviews: { rating: number }[];
      _count: { reviews: number };
    };

    const categoriesWithProductRatings = categories.map((category) => {
      const mapProduct = (product: ProductWithMeta) => {
        const avgRating =
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            : 0;

        return {
          ...product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: product._count.reviews,
        };
      };

      return {
        ...category,
        children: category.children.map((child) => ({
          ...child,
          children: child.children.map((subChild) => ({
            ...subChild,
            productCount: subChild._count?.products ?? 0,
          })),
          productCount: child._count?.products ?? 0,
        })),
        productCount: category._count?.products ?? 0,
        ...(includeProducts && category.products && {
          products: (category.products as unknown as ProductWithMeta[]).map(mapProduct),
        }),
      };
    });

    // Cache the result for 1 hour (3600 seconds)
    await cache.set(cacheKey, categoriesWithProductRatings, 3600);

    return NextResponse.json({
      success: true,
      data: categoriesWithProductRatings,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
