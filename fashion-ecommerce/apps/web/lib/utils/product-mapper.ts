// Utility functions to map database product format to frontend format
// Keep mock data structure for comparison

import { Product as FrontendProduct } from '@/contexts/ProductContext';

interface DatabaseProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: any; // Decimal
  comparePrice?: any | null; // Decimal
  costPrice?: any | null; // Decimal
  sku: string;
  barcode?: string | null;
  quantity: number;
  images: string[];
  featured: boolean;
  published: boolean;
  brand?: string | null;
  tags: string[];
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price: any; // Decimal
    quantity: number;
    attributes: any; // JSON: { size?: string, color?: string }
  }>;
  reviews?: Array<{
    rating: number;
  }>;
  _count?: {
    reviews: number;
  };
  averageRating?: number;
  reviewCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Calculate if product is new (created within last 30 days)
 */
function calculateIsNew(createdAt: Date | string): boolean {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const daysSinceCreation = Math.floor(
    (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceCreation <= 30;
}

/**
 * Calculate if product is on sale (comparePrice > price)
 */
function calculateIsOnSale(price: number, comparePrice?: number | null): boolean {
  if (!comparePrice) return false;
  return comparePrice > price;
}

/**
 * Extract unique sizes from variants
 */
function extractSizes(variants?: Array<{ attributes: any }>): string[] {
  if (!variants || variants.length === 0) return [];
  const sizes = new Set<string>();
  variants.forEach((variant) => {
    if (variant.attributes?.size) {
      sizes.add(variant.attributes.size);
    }
  });
  return Array.from(sizes).sort();
}

/**
 * Extract unique colors from variants
 */
function extractColors(variants?: Array<{ attributes: any }>): string[] {
  if (!variants || variants.length === 0) return [];
  const colors = new Set<string>();
  variants.forEach((variant) => {
    if (variant.attributes?.color) {
      colors.add(variant.attributes.color);
    }
  });
  return Array.from(colors).sort();
}

/**
 * Calculate average rating from reviews
 */
function calculateRating(reviews?: Array<{ rating: number }>): number {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Map database product to frontend product format
 */
export function mapDatabaseProductToFrontend(dbProduct: DatabaseProduct): FrontendProduct {
  const price = typeof dbProduct.price === 'object' && 'toNumber' in dbProduct.price
    ? dbProduct.price.toNumber()
    : Number(dbProduct.price);
  
  const comparePrice = dbProduct.comparePrice
    ? (typeof dbProduct.comparePrice === 'object' && 'toNumber' in dbProduct.comparePrice
        ? dbProduct.comparePrice.toNumber()
        : Number(dbProduct.comparePrice))
    : undefined;

  const averageRating = dbProduct.averageRating ?? calculateRating(dbProduct.reviews);
  const reviewCount = dbProduct.reviewCount ?? dbProduct._count?.reviews ?? 0;
  const isNew = calculateIsNew(dbProduct.createdAt);
  const isOnSale = calculateIsOnSale(price, comparePrice);
  const sizes = extractSizes(dbProduct.variants);
  const colors = extractColors(dbProduct.variants);
  const inStock = dbProduct.quantity > 0;

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price,
    originalPrice: comparePrice,
    images: dbProduct.images || [],
    category: dbProduct.category
      ? {
          id: dbProduct.category.id,
          name: dbProduct.category.name,
          slug: dbProduct.category.slug,
        }
      : undefined,
    subcategory: dbProduct.category?.parent?.name,
    brand: dbProduct.brand || '',
    sizes,
    colors,
    stock: dbProduct.quantity,
    inStock,
    rating: averageRating,
    reviewCount,
    tags: dbProduct.tags || [],
    isNew,
    isFeatured: dbProduct.featured,
    isOnSale,
    createdAt: typeof dbProduct.createdAt === 'string' 
      ? dbProduct.createdAt 
      : dbProduct.createdAt.toISOString(),
    updatedAt: typeof dbProduct.updatedAt === 'string'
      ? dbProduct.updatedAt
      : dbProduct.updatedAt.toISOString(),
  };
}

/**
 * Map array of database products to frontend format
 */
export function mapDatabaseProductsToFrontend(
  dbProducts: DatabaseProduct[]
): FrontendProduct[] {
  return dbProducts.map(mapDatabaseProductToFrontend);
}

