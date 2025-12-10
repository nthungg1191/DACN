'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { ProductProvider } from './ProductContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ErrorBoundary>
      <SessionProvider
        refetchInterval={5 * 60} // Refetch session every 5 minutes
        refetchOnWindowFocus={false} // Don't refetch on window focus to avoid message channel issues
      >
        <ToastProvider>
          <ProductProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </ProductProvider>
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
