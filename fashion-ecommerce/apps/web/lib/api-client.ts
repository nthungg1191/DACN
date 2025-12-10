// API Client utilities for testing and development
import { ApiResponse, Product, Category, CartResponse, WishlistResponse, SearchResponse } from './types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Handle 401 Unauthorized - session is invalid or expired
    if (response.status === 401) {
      // Only handle on client side
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Don't redirect if already on signin/login pages or admin routes
        const isSigninPage = currentPath === '/auth/signin';
        const isAdminLoginPage = currentPath === '/admin/login';
        const isAdminRoute = currentPath.startsWith('/admin');
        
        if (!isSigninPage && !isAdminLoginPage && !isAdminRoute) {
          const callbackUrl = currentPath + window.location.search;
          // Prevent redirect loop: don't set callbackUrl if it's already /auth/signin
          if (callbackUrl === '/auth/signin' || callbackUrl.startsWith('/auth/signin')) {
            window.location.href = '/auth/signin';
          } else {
            window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
          }
        }
      }
      const error = await response.json().catch(() => ({ error: 'Unauthorized' }));
      throw new Error(error.error || 'Unauthorized - Please sign in again');
    }
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Products API
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: 'name' | 'price' | 'createdAt' | 'rating';
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }): Promise<ApiResponse<{ products: Product[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return this.request(endpoint);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.request(`/products/${id}`);
  }

  async searchProducts(query: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'name' | 'price' | 'createdAt' | 'rating';
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ApiResponse<SearchResponse>> {
    const searchParams = new URLSearchParams({ q: query });
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request(`/products/search?${searchParams.toString()}`);
  }

  // Categories API
  async getCategories(params?: {
    includeProducts?: boolean;
    limit?: number;
  }): Promise<ApiResponse<Category[]>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/categories?${queryString}` : '/categories';
    
    return this.request(endpoint);
  }

  async getCategoryProducts(id: string, params?: {
    page?: number;
    limit?: number;
    sort?: 'name' | 'price' | 'createdAt' | 'rating';
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }): Promise<ApiResponse<{ category: any; products: Product[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/categories/${id}/products?${queryString}` : `/categories/${id}/products`;
    
    return this.request(endpoint);
  }

  // Cart API
  async getCart(): Promise<ApiResponse<CartResponse>> {
    return this.request('/cart');
  }

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<any>> {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return this.request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<any>> {
    return this.request(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Wishlist API
  async getWishlist(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<WishlistResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/wishlist?${queryString}` : '/wishlist';
    
    return this.request(endpoint);
  }

  async addToWishlist(productId: string): Promise<ApiResponse<any>> {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  async removeFromWishlist(itemId: string): Promise<ApiResponse<any>> {
    return this.request(`/wishlist/${itemId}`, {
      method: 'DELETE',
    });
  }

  async checkWishlist(productId: string): Promise<ApiResponse<{
    isInWishlist: boolean;
    wishlistItemId: string | null;
    addedAt: string | null;
  }>> {
    return this.request(`/wishlist/check?productId=${productId}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
