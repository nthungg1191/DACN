import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const [wishlistItems, totalCount] = await Promise.all([
      prisma.wishlist.findMany({
        where: {
          userId: user.id,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              featured: true,
              published: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.wishlist.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    // Calculate average rating for each product
    const wishlistWithRatings = wishlistItems.map((item: any) => {
      const avgRating = item.product.reviews.length > 0
        ? item.product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / item.product.reviews.length
        : 0;

      return {
        ...item,
        product: {
          ...item.product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: item.product._count.reviews,
        },
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        wishlist: wishlistWithRatings,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch wishlist',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const addItemSchema = z.object({
      productId: z.string().min(1, 'Product ID is required'),
    });

    const { productId } = addItemSchema.parse(body);

    // Check if product exists and is published
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        published: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found or not available',
        },
        { status: 404 }
      );
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlist.findFirst({
      where: {
        userId: user.id,
        productId: productId,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item already in wishlist',
        },
        { status: 400 }
      );
    }

    // Add item to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId: productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            featured: true,
            published: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
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
      },
    });

    // Calculate average rating
    const avgRating = wishlistItem.product.reviews.length > 0
      ? wishlistItem.product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / wishlistItem.product.reviews.length
      : 0;

    const wishlistItemWithRating = {
      ...wishlistItem,
      product: {
        ...wishlistItem.product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: wishlistItem.product._count.reviews,
      },
    };

    return NextResponse.json({
      success: true,
      data: wishlistItemWithRating,
      message: 'Item added to wishlist',
    });
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add item to wishlist',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
