// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  quantity: number;
  images: string[];
  featured: boolean;
  published: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: ProductVariant[];
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    image?: string;
  };
  productId: string;
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children: Category[];
  productCount: number;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

// Cart Types
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  cart: Cart;
  totalItems: number;
  subtotal: number;
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface WishlistResponse {
  wishlist: WishlistItem[];
  pagination: Pagination;
}

// Pagination Types
export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search Types
export interface SearchResponse {
  products: Product[];
  pagination: Pagination;
  searchQuery: string;
  suggestions: string[];
}

// Query Parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: 'name' | 'price' | 'createdAt' | 'rating';
  order?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}

export interface CategoryQueryParams {
  includeProducts?: boolean;
  limit?: number;
}

export interface WishlistQueryParams {
  page?: number;
  limit?: number;
}

// Error Types
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}
