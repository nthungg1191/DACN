import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { cache } from '@/lib/redis';

const listQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  parentId: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

// GET /api/admin/categories
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const parsed = listQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const page = parseInt(parsed.page);
    const limit = parseInt(parsed.limit);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (parsed.search) {
      where.OR = [
        { name: { contains: parsed.search, mode: 'insensitive' } },
        { slug: { contains: parsed.search, mode: 'insensitive' } },
      ];
    }
    if (parsed.parentId) {
      where.parentId = parsed.parentId;
    }

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          parentId: true,
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { children: true, products: true } },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.category.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const body = await request.json();
    const data = categorySchema.parse(body);

    if (data.parentId === data.slug) {
      return NextResponse.json(
        { success: false, error: 'Parent cannot be itself' },
        { status: 400 }
      );
    }

    // Ensure slug unique
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const created = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image: data.image || null,
        parentId: data.parentId || null,
      },
    });

    // Invalidate caches
    await cache.delPattern('products:*');

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
