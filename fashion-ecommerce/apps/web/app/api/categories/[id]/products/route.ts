import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  sort: z.enum(['name', 'price', 'createdAt', 'rating']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  featured: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = paramsSchema.parse(params);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    // First, check if category exists and get its children
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          select: { id: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }

    // Get all category IDs (current category + its children)
    const categoryIds = [id, ...category.children.map(child => child.id)];

    // Build where clause
    const where: any = {
      published: true,
      categoryId: {
        in: categoryIds,
      },
    };

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

    // Featured filter
    if (query.featured === 'true') {
      where.featured = true;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[query.sort] = query.order;

    // Get products with pagination
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

    return NextResponse.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        products: productsWithRating,
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
    console.error('Error fetching category products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
