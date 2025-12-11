import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { cache } from '@/lib/redis';

// GET /api/admin/products - Get all products (admin only)
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
    const categoryId = searchParams.get('categoryId');
    const published = searchParams.get('published');

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (published !== null) {
      where.published = published === 'true';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              variants: true,
              reviews: true,
              orderItems: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin products API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create product (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const body = await request.json();

    const variantSchema = z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      sku: z.string().min(1),
      price: z.number().positive(),
      quantity: z.number().int().min(0),
      attributes: z.object({
        size: z.string().optional(),
        color: z.string().optional(),
      }).passthrough(),
    });

    const productSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      slug: z.string().min(1, 'Slug is required'),
      description: z.string().min(1, 'Description is required'),
      price: z.number().positive('Price must be positive'),
      comparePrice: z.number().positive().optional().nullable(),
      costPrice: z.number().positive().optional().nullable(),
      sku: z.string().min(1, 'SKU is required'),
      barcode: z.string().optional().nullable(),
      quantity: z.number().int().min(0).default(0),
      images: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      published: z.boolean().default(false),
      brand: z.string().optional().nullable(),
      tags: z.array(z.string()).default([]),
      categoryId: z.string().min(1, 'Category is required'),
      variants: z.array(variantSchema).optional(),
    });

    const validatedData = productSchema.parse(body);
    const { variants, ...productData } = validatedData;

    // Check if slug or SKU already exists
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: productData.slug },
          { sku: productData.sku },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: existing.slug === productData.slug
            ? 'Product with this slug already exists'
            : 'Product with this SKU already exists',
        },
        { status: 400 }
      );
    }

    // Check variant SKUs if provided
    if (variants && variants.length > 0) {
      const variantSkus = variants.map((v) => v.sku);
      const duplicateSkus = variantSkus.filter((sku, index) => variantSkus.indexOf(sku) !== index);
      if (duplicateSkus.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Duplicate variant SKUs: ${duplicateSkus.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // Check if variant SKUs already exist
      const existingVariants = await prisma.productVariant.findMany({
        where: {
          sku: { in: variantSkus },
        },
      });

      if (existingVariants.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Variant SKUs already exist: ${existingVariants.map((v: any) => v.sku).join(', ')}`,
          },
          { status: 400 }
        );
      }
      // Check duplicate size/color combination
      const combos = variants
        .map((v) => {
          const size = v.attributes?.size || '';
          const color = v.attributes?.color || '';
          return `${size}::${color}`;
        });
      const dupCombos = combos.filter((c, i) => combos.indexOf(c) !== i);
      if (dupCombos.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate variant size/color combinations are not allowed',
          },
          { status: 400 }
        );
      }
    }

    const totalQuantity = variants && variants.length > 0
      ? variants.reduce((sum, v) => sum + v.quantity, 0)
      : productData.quantity || 0;

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        ...productData,
        quantity: totalQuantity,
        comparePrice: productData.comparePrice || null,
        costPrice: productData.costPrice || null,
        barcode: productData.barcode || null,
        brand: productData.brand || null,
        tags: productData.tags || [],
        variants: variants
          ? {
              create: variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                price: v.price,
                quantity: v.quantity,
                size: v.attributes?.size,
                color: v.attributes?.color,
                attributes: v.attributes as any,
              })),
            }
          : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: true,
      },
    });

    // Invalidate caches
    await cache.delPattern('products:*');
    await cache.del(`product:${product.id}`);

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    console.error('Admin create product error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}

