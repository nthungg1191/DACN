import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { cache } from '@/lib/redis';

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

// PATCH /api/admin/categories/[id] - Update category (admin only)
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

    const validatedData = updateSchema.parse(body);
    const { id } = await context.params;

    const normalizedSlug =
      validatedData.slug?.trim() ||
      validatedData.name
        ?.trim()
        ?.toLowerCase()
        ?.normalize('NFD')
        ?.replace(/[\u0300-\u036f]/g, '')
        ?.replace(/[^a-z0-9]+/g, '-')
        ?.replace(/^-+|-+$/g, '')
        ?.trim();

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }

    // Check if slug conflicts
    if (normalizedSlug) {
      const conflict = await prisma.category.findFirst({
        where: {
          id: { not: id },
          slug: normalizedSlug,
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category with this slug already exists',
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...validatedData,
        slug: normalizedSlug ?? undefined,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await cache.delPattern('products:*');

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Category updated successfully',
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
    console.error('Admin update category error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete category (admin only)
export async function DELETE(
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
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
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

    // Check if category has products or children
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category with existing products',
        },
        { status: 400 }
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category with subcategories',
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    await cache.delPattern('products:*');

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete category error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete category',
      },
      { status: 500 }
    );
  }
}

