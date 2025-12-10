import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';

const querySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  category: z.string().optional(),
  sort: z.enum(['name', 'price', 'createdAt', 'rating']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {
      published: true,
      OR: [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
        { category: { name: { contains: query.q, mode: 'insensitive' } } },
      ],
    };

    // Category filter
    if (query.category) {
      where.categoryId = query.category;
    }

    // Price range filter
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) {
        where.price.gte = parseFloat(query.minPrice);
      }
      if (query.maxPrice) {
        where.price.lte = parseFloat(query.maxPrice);
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[query.sort] = query.order;

    // Get search results with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              attributes: true,
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
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product._count.reviews,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Get search suggestions (popular search terms)
    const searchSuggestions = await prisma.product.findMany({
      where: {
        published: true,
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { category: { name: { contains: query.q, mode: 'insensitive' } } },
        ],
      },
      select: {
        name: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    });

    const suggestions = [
      ...new Set([
        ...searchSuggestions.map(p => p.name),
        ...searchSuggestions.map(p => p.category.name),
      ])
    ].slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithRating,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        searchQuery: query.q,
        suggestions,
      },
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
