import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { cache, getCacheKey } from '@/lib/redis';

// Validation schemas
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  category: z.string().optional(),
  categories: z.string().optional(), // comma-separated
  search: z.string().optional(),
  sort: z.enum(['name', 'price', 'createdAt', 'rating']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  featured: z.string().optional(),
  brands: z.string().optional(), // comma-separated
  sizes: z.string().optional(), // comma-separated
  colors: z.string().optional(), // comma-separated
  ratings: z.string().optional(), // comma-separated numbers
  inStock: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    // Generate cache key from query parameters
    // Parse multi-value params
    const categories = query.categories ? query.categories.split(',').filter(Boolean) : [];
    const brands = query.brands ? query.brands.split(',').filter(Boolean) : [];
    const sizes = query.sizes ? query.sizes.split(',').filter(Boolean) : [];
    const colors = query.colors ? query.colors.split(',').filter(Boolean) : [];
    const ratings = query.ratings
      ? query.ratings.split(',').map((r) => Number(r)).filter((n) => !Number.isNaN(n))
      : [];
    const minRating = ratings.length ? Math.max(...ratings) : undefined;
    const inStock = query.inStock === 'true';

    const cacheKey = getCacheKey('products', {
      page: query.page,
      limit: query.limit,
      category: query.category || '',
      categories: categories.join(','),
      search: query.search || '',
      sort: query.sort,
      order: query.order,
      minPrice: query.minPrice || '',
      maxPrice: query.maxPrice || '',
      featured: query.featured || '',
      brands: brands.join(','),
      sizes: sizes.join(','),
      colors: colors.join(','),
      ratings: ratings.join(','),
      inStock: inStock ? 'true' : '',
    });

    // Try to get from cache first
    const cachedData = await cache.get<{
      products: any[];
      pagination: any;
    }>(cacheKey);

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
      });
    }

    // Build where clause
    const andConditions: any[] = [];

    // Search filter
    if (query.search) {
      andConditions.push({
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    // Category filter (single) or multiple categories by name
    if (query.category) {
      andConditions.push({ categoryId: query.category });
    }
    if (categories.length) {
      andConditions.push({
        OR: [
          { categoryId: { in: categories } },
          {
            category: {
              name: { in: categories, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    // Brand filter
    if (brands.length) {
      andConditions.push({ brand: { in: brands } });
    }

    // Price range filter
    if (query.minPrice || query.maxPrice) {
      const priceClause: any = {};
      if (query.minPrice) {
        priceClause.gte = parseFloat(query.minPrice);
      }
      if (query.maxPrice) {
        priceClause.lte = parseFloat(query.maxPrice);
      }
      andConditions.push({ price: priceClause });
    }

    // Featured filter
    if (query.featured === 'true') {
      andConditions.push({ featured: true });
    }

    // Size / Color filter via variants
    if (sizes.length) {
      andConditions.push({
        variants: {
          some: { size: { in: sizes } },
        },
      });
    }
    if (colors.length) {
      andConditions.push({
        variants: {
          some: { color: { in: colors } },
        },
      });
    }

    // In-stock filter (product or any variant has quantity > 0)
    if (inStock) {
      andConditions.push({
        OR: [
          { quantity: { gt: 0 } },
          {
            variants: {
              some: { quantity: { gt: 0 } },
            },
          },
        ],
      });
    }

    // Rating filter (approx: any review with rating >= minRating)
    if (minRating !== undefined) {
      andConditions.push({
        reviews: {
          some: {
            rating: { gte: minRating },
          },
        },
      });
    }

    const where: any = {
      published: true,
      AND: andConditions,
    };

    // Build orderBy clause
    const orderBy: any =
      query.sort === 'rating'
        ? { reviews: { _avg: { rating: query.order } } }
        : { [query.sort]: query.order };

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
    const productsWithRating = products.map((product: any) => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product._count.reviews,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    const responseData = {
      products: productsWithRating,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    // Cache the result for 5 minutes (300 seconds)
    // Note: Cache for shorter time for search queries
    const cacheTTL = query.search ? 60 : 300;
    await cache.set(cacheKey, responseData, cacheTTL);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
