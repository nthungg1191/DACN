export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  brands: string[];
  sizes: string[];
  colors: string[];
  ratings: number[];
  inStock: boolean;
}

export interface ProductSortOption {
  value: string;
  label: string;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  rating?: number;
  inStock?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}
