import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getColorHex } from '@/lib/utils/color-mapper';

// GET /api/products/filter-options - Get available filter options from database
export async function GET(request: NextRequest) {
  try {
    // Get all published products with their variants
    const products = await prisma.product.findMany({
      where: { published: true },
      select: {
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        brand: true,
        price: true,
        variants: {
          select: {
            size: true,
            color: true,
            attributes: true,
          },
        },
      },
    });

    // Extract unique categories
    const categoriesMap = new Map<string, { id: string; name: string; slug: string }>();
    products.forEach((p) => {
      if (p.category) {
        categoriesMap.set(p.category.id, p.category);
      }
    });
    const categories = Array.from(categoriesMap.values());

    // Extract unique brands (non-null)
    const brandsSet = new Set<string>();
    products.forEach((p) => {
      if (p.brand) {
        brandsSet.add(p.brand);
      }
    });
    const brands = Array.from(brandsSet).sort();

    // Extract unique sizes from variants
    const sizesSet = new Set<string>();
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.size) {
          sizesSet.add(v.size);
        }
      });
    });
    const sizes = Array.from(sizesSet).sort();

    // Extract unique colors from variants with hex codes
    const colorsMap = new Map<string, { name: string; hex: string }>();
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.color) {
          const colorHex = (v.attributes as any)?.colorHex;
          const hex = getColorHex(v.color, colorHex);
          if (!colorsMap.has(v.color)) {
            colorsMap.set(v.color, { name: v.color, hex });
          }
        }
      });
    });
    const colors = Array.from(colorsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Calculate min and max price
    const prices = products.map((p) => Number(p.price));
    const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
    const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000000;

    return NextResponse.json({
      success: true,
      data: {
        categories,
        brands,
        sizes,
        colors,
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch filter options',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

