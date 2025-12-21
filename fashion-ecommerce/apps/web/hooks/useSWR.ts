import useSWR, { SWRConfiguration } from 'swr';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/lib/types/api';

/**
 * Handle 401 Unauthorized response
 * Redirects to login page and clears session
 * Chỉ redirect khi đang ở trang yêu cầu authentication
 */
function handleUnauthorized(url: string) {
  // Only handle on client side
  if (typeof window === 'undefined') return;
  
  const currentPath = window.location.pathname;
  // Don't redirect if already on signin/login pages or admin routes
  const isSigninPage = currentPath === '/auth/signin';
  const isAdminLoginPage = currentPath === '/admin/login';
  const isAdminRoute = currentPath.startsWith('/admin');
  
  if (isSigninPage || isAdminLoginPage || isAdminRoute) {
    return;
  }
  
  // Chỉ redirect khi đang ở trang yêu cầu authentication
  // Không redirect khi ở trang public như /, /products, /products/[id]
  const requiresAuth = 
    currentPath.startsWith('/checkout') ||
    currentPath.startsWith('/orders') ||
    currentPath.startsWith('/profile') ||
    currentPath.startsWith('/addresses') ||
    currentPath.startsWith('/payment');
  
  if (!requiresAuth) {
    return; // Không redirect khi ở trang public
  }
  
  // Get current path for callback URL
  const callbackUrl = currentPath + window.location.search;
  
  // Prevent redirect loop: don't set callbackUrl if it's already /auth/signin
  if (callbackUrl === '/auth/signin' || callbackUrl.startsWith('/auth/signin')) {
    window.location.href = '/auth/signin';
  } else {
    const loginUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = loginUrl;
  }
}

/**
 * Generic fetcher function for SWR
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  });
  
  // Handle 401 Unauthorized - session is invalid or expired
  if (response.status === 401) {
    handleUnauthorized(url);
    const error = await response.json().catch(() => ({ error: 'Unauthorized' }));
    throw new Error(error.error || 'Unauthorized - Please sign in again');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'An error occurred while fetching data');
  }
  
  const data: ApiResponse<T> = await response.json();
  if (!data.data) {
    throw new Error('No data returned from API');
  }
  return data.data;
};

/**
 * SWR configuration
 */
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: any) => {
    // Don't retry on 401 errors - user needs to re-authenticate
    if (error?.message?.includes('Unauthorized')) {
      return false;
    }
    return true;
  },
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
  onError: (error: any, key) => {
    // Log error for debugging
    if (error?.message?.includes('Unauthorized')) {
      console.warn('Unauthorized request to:', key);
    } else {
      console.error('SWR Error:', error, 'for key:', key);
    }
  },
};

/**
 * Hook for fetching products with SWR
 */
export function useProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: 'name' | 'price' | 'createdAt' | 'rating';
  order?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const queryString = searchParams.toString();
  const key = queryString ? `/api/products?${queryString}` : '/api/products';

  const { data, error, isLoading, mutate } = useSWR(
    key,
    (url) => fetcher<{ products: any[]; pagination: any }>(url),
    swrConfig
  );

  return {
    products: data?.products || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching a single product
 */
export function useProduct(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/products/${id}` : null,
    (url) => fetcher<any>(url),
    swrConfig
  );

  return {
    product: data,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for searching products
 */
export function useSearchProducts(
  query: string | null,
  params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'name' | 'price' | 'createdAt' | 'rating';
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
  }
) {
  if (!query) {
    return {
      products: [],
      pagination: null,
      isLoading: false,
      isError: false,
      error: null,
      mutate: async () => {},
    };
  }

  const searchParams = new URLSearchParams({ q: query });
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const key = `/api/products/search?${searchParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    (url) => fetcher<{ products: any[]; pagination: any; query: string }>(url),
    swrConfig
  );

  return {
    products: data?.products || [],
    pagination: data?.pagination,
    query: data?.query || query,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching categories
 */
export function useCategories(includeProducts?: boolean) {
  const searchParams = new URLSearchParams();
  if (includeProducts) {
    searchParams.append('includeProducts', 'true');
  }

  const queryString = searchParams.toString();
  const key = queryString ? `/api/categories?${queryString}` : '/api/categories';

  const { data, error, isLoading, mutate } = useSWR(
    key,
    (url) => fetcher<any[]>(url),
    swrConfig
  );

  return {
    categories: data || [],
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching category products
 */
export function useCategoryProducts(
  categoryId: string | null,
  params?: {
    page?: number;
    limit?: number;
    sort?: 'name' | 'price' | 'createdAt' | 'rating';
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }
) {
  if (!categoryId) {
    return {
      category: null,
      products: [],
      pagination: null,
      isLoading: false,
      isError: false,
      error: null,
      mutate: async () => {},
    };
  }

  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const queryString = searchParams.toString();
  const key = queryString
    ? `/api/categories/${categoryId}/products?${queryString}`
    : `/api/categories/${categoryId}/products`;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    (url) => fetcher<{ category: any; products: any[]; pagination: any }>(url),
    swrConfig
  );

  return {
    category: data?.category,
    products: data?.products || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching cart
 */
export function useCart() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/cart',
    (url) => fetcher<any>(url),
    {
      ...swrConfig,
      revalidateOnFocus: true, // Cart should update when user comes back
    }
  );

  return {
    cart: data,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for product reviews
 */
export function useProductReviews(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/products/${productId}/reviews` : null,
    (url) => fetcher<any>(url),
    {
      ...swrConfig,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  // Fetcher already extracts data.data, so data here is { reviews: [...], stats: {...} }
  return {
    reviews: data?.reviews || [],
    stats: data?.stats || {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching wishlist
 */
export function useWishlist(params?: {
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const queryString = searchParams.toString();
  const key = queryString ? `/api/wishlist?${queryString}` : '/api/wishlist';

  const { data, error, isLoading, mutate } = useSWR(
    key,
    (url) => fetcher<any>(url),
    {
      ...swrConfig,
      revalidateOnFocus: true, // Wishlist should update when user comes back
    }
  );

  return {
    wishlist: data,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching addresses
 */
export function useAddresses() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/addresses',
    (url) => fetcher<any[]>(url),
    {
      ...swrConfig,
      revalidateOnFocus: true,
    }
  );

  return {
    addresses: data || [],
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching a single address
 */
export function useAddress(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/addresses/${id}` : null,
    (url) => fetcher<any>(url),
    swrConfig
  );

  return {
    address: data,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Custom fetcher for orders (handles special response structure)
 * API returns: { success: true, data: orders[], pagination: {...} }
 */
const ordersFetcher = async (url: string): Promise<{ data: any[]; pagination: any }> => {
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (response.status === 401) {
    handleUnauthorized(url);
    const error = await response.json().catch(() => ({ error: 'Unauthorized' }));
    throw new Error(error.error || 'Unauthorized - Please sign in again');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'An error occurred while fetching orders');
  }
  
  // API returns { success: true, data: orders[], pagination: {...} }
  const apiResponse = await response.json();
  
  if (apiResponse.success) {
    return {
      data: apiResponse.data || [],
      pagination: apiResponse.pagination || {},
    };
  }
  
  throw new Error(apiResponse.error || 'Invalid response format from orders API');
};

/**
 * Hook for fetching orders
 */
export function useOrders(params?: {
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const queryString = searchParams.toString();
  // Only fetch if params is provided (conditional fetching)
  const key = params ? (queryString ? `/api/orders?${queryString}` : '/api/orders') : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ordersFetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false, // Không reload khi focus vào tab
      revalidateIfStale: true, // ✅ FIX: Tự động revalidate khi dữ liệu stale (quan trọng cho refresh)
      revalidateOnReconnect: true, // ✅ FIX: Reload khi reconnect
      // Dedupe requests within 2 seconds (giảm từ 5s để refresh nhanh hơn)
      dedupingInterval: 2000,
    }
  );

  return {
    orders: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching a single order
 */
export function useOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/orders/${id}` : null,
    (url) => fetcher<any>(url),
    swrConfig
  );

  return {
    order: data,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

