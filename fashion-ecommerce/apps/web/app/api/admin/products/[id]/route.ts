import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { cache } from '@/lib/redis';

// GET /api/admin/products/[id] - Get product detail (admin only)
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: true,
        _count: {
          select: {
            reviews: true,
            orderItems: true,
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

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Admin product detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id] - Update product (admin only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      price: z.number().positive().optional(),
      comparePrice: z.number().positive().optional().nullable(),
      costPrice: z.number().positive().optional().nullable(),
      sku: z.string().min(1).optional(),
      barcode: z.string().optional().nullable(),
      quantity: z.number().int().min(0).optional(),
      images: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      published: z.boolean().optional(),
      brand: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      categoryId: z.string().min(1).optional(),
      variants: z.array(variantSchema).optional(),
    });

    const validatedData = updateSchema.parse(body);
    const { variants, ...productData } = validatedData;
    const { id } = await context.params;

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Check if slug or SKU conflicts with other products
    if (productData.slug || productData.sku) {
      const conflict = await prisma.product.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(productData.slug ? [{ slug: productData.slug }] : []),
            ...(productData.sku ? [{ sku: productData.sku }] : []),
          ],
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: conflict.slug === productData.slug
              ? 'Product with this slug already exists'
              : 'Product with this SKU already exists',
          },
          { status: 400 }
        );
      }
    }

    // Handle variants if provided
    let totalQuantity = productData.quantity ?? existing.quantity;

    if (variants !== undefined) {
      // Check variant SKUs for duplicates
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

      // Check if new variant SKUs conflict with existing variants from other products
      const existingVariantIds = existing.variants.map((v: any) => v.id);
      const newVariantSkus = variants.filter((v) => !v.id || !existingVariantIds.includes(v.id)).map((v) => v.sku);
      
      if (newVariantSkus.length > 0) {
        const conflictingVariants = await prisma.productVariant.findMany({
          where: {
            sku: { in: newVariantSkus },
            productId: { not: id },
          },
        });

        if (conflictingVariants.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Variant SKUs already exist: ${conflictingVariants.map((v: any) => v.sku).join(', ')}`,
            },
            { status: 400 }
          );
        }
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

      // Update variants: delete old ones, create/update new ones
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v) => ({
            productId: id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            quantity: v.quantity,
            size: v.attributes?.size,
            color: v.attributes?.color,
            attributes: v.attributes as any,
          })),
        });

        totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0);
      } else {
        totalQuantity = 0;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        quantity: totalQuantity,
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
    await cache.del(`product:${id}`);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Product updated successfully',
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
    console.error('Admin update product error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update product',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            orderItems: true,
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

    // Check if product has orders
    if (product._count.orderItems > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product with existing orders',
        },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    await cache.delPattern('products:*');
    await cache.del(`product:${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
      },
      { status: 500 }
    );
  }
}

