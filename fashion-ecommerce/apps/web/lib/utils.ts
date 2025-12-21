import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Handle 401 Unauthorized response - redirects to login
 * Use this in components that make direct fetch calls
 * Chỉ redirect khi đang ở trang yêu cầu authentication
 */
export function handleUnauthorizedResponse() {
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
  
  const callbackUrl = currentPath + window.location.search;
  
  // Prevent redirect loop: don't set callbackUrl if it's already /auth/signin
  if (callbackUrl === '/auth/signin' || callbackUrl.startsWith('/auth/signin')) {
    window.location.href = '/auth/signin';
  } else {
    window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }
}

/**
 * Fetch wrapper that handles 401 errors
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    handleUnauthorizedResponse();
    throw new Error('Unauthorized - Please sign in again');
  }

  return response;
}

