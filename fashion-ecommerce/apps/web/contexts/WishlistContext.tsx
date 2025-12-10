'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { authenticatedFetch } from '@/lib/utils';

// Types
export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size?: string;
  color?: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;
}

type WishlistAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'SYNC_WISHLIST' };

interface WishlistContextType extends WishlistState {
  addToWishlist: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistItem: (productId: string) => WishlistItem | undefined;
}

// Initial state
const initialState: WishlistState = {
  items: [],
  totalItems: 0,
  isLoading: false,
  error: null,
};

// Reducer
function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_WISHLIST':
      return {
        ...state,
        items: action.payload,
        totalItems: action.payload.length,
        isLoading: false,
        error: null,
      };
    
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      if (existingItem) {
        return state; // Item already exists
      }
      
      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        totalItems: newItems.length,
      };
    
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        totalItems: filteredItems.length,
      };
    
    case 'CLEAR_WISHLIST':
      return {
        ...state,
        items: [],
        totalItems: 0,
      };
    
    case 'SYNC_WISHLIST':
      // Sync with localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(state.items));
      }
      return state;
    
    default:
      return state;
  }
}

// Context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Provider
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { toast } = useToast();

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        try {
          const wishlistItems = JSON.parse(savedWishlist);
          dispatch({ type: 'SET_WISHLIST', payload: wishlistItems });
        } catch (error) {
          console.error('Error loading wishlist from localStorage:', error);
        }
      }
    }
  }, []);

  // Sync wishlist to localStorage when items change
  useEffect(() => {
    dispatch({ type: 'SYNC_WISHLIST' });
  }, [state.items]);

  // API functions
  const addToWishlist = async (item: Omit<WishlistItem, 'id' | 'addedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const wishlistItem: WishlistItem = {
        ...item,
        id: `${item.productId}-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };

      // Check if item already exists
      if (state.items.some(existingItem => existingItem.productId === item.productId)) {
        toast({
          title: 'Already in Wishlist',
          description: `${item.name} is already in your wishlist`,
          type: 'info',
        });
        return;
      }

      dispatch({ type: 'ADD_ITEM', payload: wishlistItem });
      
      // Call API to sync with server
      const response = await authenticatedFetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          size: item.size,
          color: item.color,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to wishlist');
      }

      toast({
        title: 'Added to Wishlist',
        description: `${item.name} has been added to your wishlist`,
        type: 'success',
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to wishlist' });
      toast({
        title: 'Error',
        description: 'Failed to add item to wishlist. Please try again.',
        type: 'error',
      });
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      const item = state.items.find(item => item.id === id);
      dispatch({ type: 'REMOVE_ITEM', payload: id });
      
      // Call API to sync with server
      await authenticatedFetch(`/api/wishlist/${id}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Removed from Wishlist',
        description: item ? `${item.name} has been removed from your wishlist` : 'Item has been removed from your wishlist',
        type: 'success',
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from wishlist' });
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist. Please try again.',
        type: 'error',
      });
    }
  };

  const clearWishlist = async () => {
    try {
      dispatch({ type: 'CLEAR_WISHLIST' });
      
      // Call API to clear wishlist on server
      await fetch('/api/wishlist', {
        method: 'DELETE',
      });

      toast({
        title: 'Wishlist Cleared',
        description: 'Your wishlist has been cleared',
        type: 'success',
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear wishlist' });
      toast({
        title: 'Error',
        description: 'Failed to clear wishlist. Please try again.',
        type: 'error',
      });
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return state.items.some(item => item.productId === productId);
  };

  const getWishlistItem = (productId: string): WishlistItem | undefined => {
    return state.items.find(item => item.productId === productId);
  };

  const value: WishlistContextType = {
    ...state,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    getWishlistItem,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// Hook
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
