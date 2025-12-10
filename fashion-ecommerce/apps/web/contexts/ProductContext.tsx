'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { mapDatabaseProductsToFrontend, mapDatabaseProductToFrontend } from '@/lib/utils/product-mapper';

// Types
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
  subcategory?: string;
  brand: string;
  sizes: string[];
  colors: string[];
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  isNew: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  categories?: string[]; // support multi-category
  subcategory?: string;
  brand?: string;
  brands?: string[]; // support multi-brand
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  ratings?: number[]; // selected rating thresholds (use highest as min rating)
  isNew?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  inStock?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'popularity';
  direction: 'asc' | 'desc';
}

export interface ProductSearchParams {
  query?: string;
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  newProducts: Product[];
  saleProducts: Product[];
  currentProduct: Product | null;
  searchResults: Product[];
  filters: ProductFilters;
  sort: ProductSort;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
}

type ProductAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_FEATURED_PRODUCTS'; payload: Product[] }
  | { type: 'SET_NEW_PRODUCTS'; payload: Product[] }
  | { type: 'SET_SALE_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CURRENT_PRODUCT'; payload: Product | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: Product[] }
  | { type: 'SET_FILTERS'; payload: ProductFilters }
  | { type: 'SET_SORT'; payload: ProductSort }
  | { type: 'SET_PAGINATION'; payload: { page: number; limit: number; total: number; totalPages: number } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'CLEAR_SEARCH' };

interface ProductContextType extends ProductState {
  fetchProducts: (params?: ProductSearchParams) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchNewProducts: () => Promise<void>;
  fetchSaleProducts: () => Promise<void>;
  searchProducts: (query: string, params?: Omit<ProductSearchParams, 'query'>) => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  setSort: (sort: ProductSort) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  getProductById: (id: string) => Product | undefined;
  getRelatedProducts: (productId: string, limit?: number) => Product[];
}

// Initial state
const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  newProducts: [],
  saleProducts: [],
  currentProduct: null,
  searchResults: [],
  filters: {},
  sort: { field: 'createdAt', direction: 'desc' },
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isSearching: false,
  error: null,
};

// Reducer
function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isSearching: false };
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, isLoading: false };
    
    case 'SET_FEATURED_PRODUCTS':
      return { ...state, featuredProducts: action.payload };
    
    case 'SET_NEW_PRODUCTS':
      return { ...state, newProducts: action.payload };
    
    case 'SET_SALE_PRODUCTS':
      return { ...state, saleProducts: action.payload };
    
    case 'SET_CURRENT_PRODUCT':
      return { ...state, currentProduct: action.payload };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload, isSearching: false };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };
    
    case 'CLEAR_FILTERS':
      return { ...state, filters: {} };
    
    case 'CLEAR_SEARCH':
      return { ...state, searchResults: [], filters: {} };
    
    default:
      return state;
  }
}

// Context
const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Provider
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(productReducer, initialState);
  const { toast } = useToast();

  // API functions
  const fetchProducts = async (params?: ProductSearchParams) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.filters?.category) queryParams.append('category', params.filters.category);
      if (params?.filters?.categories?.length) queryParams.append('categories', params.filters.categories.join(','));
      if (params?.query) queryParams.append('search', params.query);
      if (params?.sort?.field) queryParams.append('sort', params.sort.field);
      if (params?.sort?.direction) queryParams.append('order', params.sort.direction);
      if (params?.filters?.minPrice) queryParams.append('minPrice', params.filters.minPrice.toString());
      if (params?.filters?.maxPrice) queryParams.append('maxPrice', params.filters.maxPrice.toString());
      if (params?.filters?.isFeatured) queryParams.append('featured', 'true');
      if (params?.filters?.brands?.length) queryParams.append('brands', params.filters.brands.join(','));
      if (params?.filters?.sizes?.length) queryParams.append('sizes', params.filters.sizes.join(','));
      if (params?.filters?.colors?.length) queryParams.append('colors', params.filters.colors.join(','));
      if (params?.filters?.ratings?.length) queryParams.append('ratings', params.filters.ratings.join(','));
      if (params?.filters?.inStock) queryParams.append('inStock', 'true');

      const response = await fetch(`/api/products?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch products');
      }

      // Map database products to frontend format
      const mappedProducts = mapDatabaseProductsToFrontend(result.data.products);
      
      // Apply additional filters that API doesn't support yet
      let filteredProducts = [...mappedProducts];
      
      // Apply additional client-side filters that API doesn't support yet
      if (params?.filters?.subcategory) {
        filteredProducts = filteredProducts.filter(p => p.subcategory === params.filters!.subcategory);
      }
      if (params?.filters?.brand) {
        filteredProducts = filteredProducts.filter(p => p.brand === params.filters!.brand);
      }
      if (params?.filters?.isNew) {
        filteredProducts = filteredProducts.filter(p => p.isNew === params.filters!.isNew);
      }
      if (params?.filters?.isOnSale) {
        filteredProducts = filteredProducts.filter(p => p.isOnSale === params.filters!.isOnSale);
      }
      if (params?.filters?.ratings?.length) {
        const minRating = Math.max(...params.filters.ratings);
        filteredProducts = filteredProducts.filter(p => (p.rating || 0) >= minRating);
      }
      
      // Use pagination from API response
      const pagination = result.data.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 12,
        totalCount: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / (params?.limit || 12)),
      };
      
      dispatch({ type: 'SET_PRODUCTS', payload: filteredProducts });
      dispatch({ type: 'SET_PAGINATION', payload: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.totalCount,
        totalPages: pagination.totalPages,
      }});
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch products' });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        type: 'error',
      });
    }
  };

  const fetchProduct = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`/api/products/${id}`);
      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Product not found');
      }

      // Map database product to frontend format
      const mappedProduct = mapDatabaseProductToFrontend(result.data);
      dispatch({ type: 'SET_CURRENT_PRODUCT', payload: mappedProduct });
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch product' });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast({
        title: 'Error',
        description: 'Failed to load product. Please try again.',
        type: 'error',
      });
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=12');
      const result = await response.json();

      if (result.success && result.data) {
        const mappedProducts = mapDatabaseProductsToFrontend(result.data.products);
        dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: mappedProducts });
      } else {
        dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: [] });
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: [] });
    }
  };

  const fetchNewProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=12&sort=createdAt&order=desc');
      const result = await response.json();

      if (result.success && result.data) {
        const mappedProducts = mapDatabaseProductsToFrontend(result.data.products);
        // Filter isNew on client side (created within 30 days)
        const newProducts = mappedProducts.filter(p => p.isNew);
        dispatch({ type: 'SET_NEW_PRODUCTS', payload: newProducts });
      } else {
        dispatch({ type: 'SET_NEW_PRODUCTS', payload: [] });
      }
    } catch (error) {
      console.error('Failed to fetch new products:', error);
      dispatch({ type: 'SET_NEW_PRODUCTS', payload: [] });
    }
  };

  const fetchSaleProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=12');
      const result = await response.json();

      if (result.success && result.data) {
        const mappedProducts = mapDatabaseProductsToFrontend(result.data.products);
        // Filter isOnSale on client side (comparePrice > price)
        const saleProducts = mappedProducts.filter(p => p.isOnSale);
        dispatch({ type: 'SET_SALE_PRODUCTS', payload: saleProducts });
      } else {
        dispatch({ type: 'SET_SALE_PRODUCTS', payload: [] });
      }
    } catch (error) {
      console.error('Lỗi tải sản phẩm giảm giá:', error);
      dispatch({ type: 'SET_SALE_PRODUCTS', payload: [] });
    }
  };

  const searchProducts = async (query: string, params?: Omit<ProductSearchParams, 'query'>) => {
    try {
      dispatch({ type: 'SET_SEARCHING', payload: true });
      
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('search', query);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.filters?.category) queryParams.append('category', params.filters.category);
      if (params?.sort?.field) queryParams.append('sort', params.sort.field);
      if (params?.sort?.direction) queryParams.append('order', params.sort.direction);

      const response = await fetch(`/api/products?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Lỗi tìm kiếm sản phẩm');
      }

      // Map database products to frontend format
      let filteredProducts = mapDatabaseProductsToFrontend(result.data.products);
      
      // Apply search query
      if (query) {
        const searchQuery = query.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchQuery) ||
          p.description.toLowerCase().includes(searchQuery) ||
          p.brand.toLowerCase().includes(searchQuery) ||
          (p.category?.name || '').toLowerCase().includes(searchQuery)
        );
      }
      
      // Apply filters
      if (params?.filters?.category) {
        filteredProducts = filteredProducts.filter(p => p.category?.id === params.filters!.category);
      }
      if (params?.filters?.subcategory) {
        filteredProducts = filteredProducts.filter(p => p.subcategory === params.filters!.subcategory);
      }
      if (params?.filters?.brand) {
        filteredProducts = filteredProducts.filter(p => p.brand === params.filters!.brand);
      }
      if (params?.filters?.minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= params.filters!.minPrice!);
      }
      if (params?.filters?.maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= params.filters!.maxPrice!);
      }
      if (params?.filters?.isNew) {
        filteredProducts = filteredProducts.filter(p => p.isNew === params.filters!.isNew);
      }
      if (params?.filters?.isFeatured) {
        filteredProducts = filteredProducts.filter(p => p.isFeatured === params.filters!.isFeatured);
      }
      if (params?.filters?.isOnSale) {
        filteredProducts = filteredProducts.filter(p => p.isOnSale === params.filters!.isOnSale);
      }
      if (params?.filters?.inStock) {
        filteredProducts = filteredProducts.filter(p => p.stock > 0);
      }
      
      // Apply sorting
      const sortField = params?.sort?.field || 'createdAt';
      const sortDirection = params?.sort?.direction || 'desc';
      
      filteredProducts.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        if (sortField === 'price') {
          aValue = a.price;
          bValue = b.price;
        } else if (sortField === 'rating') {
          aValue = a.rating;
          bValue = b.rating;
        } else if (sortField === 'createdAt') {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
        } else if (sortField === 'name') {
          aValue = a.name;
          bValue = b.name;
        } else {
          aValue = a.createdAt;
          bValue = b.createdAt;
        }
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: filteredProducts });
      dispatch({ type: 'SET_SEARCHING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Lỗi tìm kiếm sản phẩm' });
      dispatch({ type: 'SET_SEARCHING', payload: false });
      toast({
        title: 'Lỗi',
        description: 'Lỗi tìm kiếm sản phẩm. Vui lòng thử lại.',
        type: 'error',
      });
    }
  };

  const setFilters = (filters: ProductFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setSort = (sort: ProductSort) => {
    dispatch({ type: 'SET_SORT', payload: sort });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  const getProductById = (id: string): Product | undefined => {
    return state.products.find(product => product.id === id) ||
           state.featuredProducts.find(product => product.id === id) ||
           state.newProducts.find(product => product.id === id) ||
           state.saleProducts.find(product => product.id === id) ||
           state.searchResults.find(product => product.id === id);
  };

  const getRelatedProducts = (productId: string, limit: number = 4): Product[] => {
    const currentProduct = getProductById(productId);
    if (!currentProduct) return [];

    return state.products
      .filter(product => 
        product.id !== productId && 
        (product.category?.id === currentProduct.category?.id || 
         product.brand === currentProduct.brand)
      )
      .slice(0, limit);
  };

  const value: ProductContextType = {
    ...state,
    fetchProducts,
    fetchProduct,
    fetchFeaturedProducts,
    fetchNewProducts,
    fetchSaleProducts,
    searchProducts,
    setFilters,
    setSort,
    clearFilters,
    clearSearch,
    getProductById,
    getRelatedProducts,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

// Hook
export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
