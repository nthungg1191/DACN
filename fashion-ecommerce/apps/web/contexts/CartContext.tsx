'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { authenticatedFetch } from '@/lib/utils';

// Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalDiscount: number;
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SYNC_CART' };

interface CartContextType extends CartState {
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemQuantity: (productId: string, size?: string, color?: string) => number;
  isInCart: (productId: string, size?: string, color?: string) => boolean;
}

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  totalDiscount: 0,
  isLoading: false,
  error: null,
};

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CART':
      return {
        ...state,
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        totalDiscount: action.payload.reduce((sum, item) => 
          sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0),
        isLoading: false,
        error: null,
      };
    
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && 
                item.size === action.payload.size && 
                item.color === action.payload.color
      );
      
      let newItems;
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: Math.min(item.quantity + action.payload.quantity, item.maxQuantity) }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      
      return {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        totalDiscount: newItems.reduce((sum, item) => 
          sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0),
      };
    
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        totalItems: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        totalDiscount: filteredItems.reduce((sum, item) => 
          sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0),
      };
    
    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.min(Math.max(action.payload.quantity, 0), item.maxQuantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        totalDiscount: updatedItems.reduce((sum, item) => 
          sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        totalDiscount: 0,
      };
    
    case 'SYNC_CART':
      // Sync with localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
      return state;
    
    default:
      return state;
  }
}

// Helper function to transform API response to CartItem format
const transformCartItems = (apiItems: any[]): CartItem[] => {
  return apiItems.map((item: any) => {
    const variantPrice = item.price ?? item.product?.price;
    return {
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      price: Number(variantPrice),
      originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : undefined,
      image: item.product.images && item.product.images.length > 0 
        ? item.product.images[0] 
        : '/images/products/product-placeholder.jpg',
      size: item.size || undefined,
      color: item.color || undefined,
      quantity: item.quantity,
      maxQuantity: item.product.quantity || 99,
    };
  });
};

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { toast } = useToast();

  // Fetch cart from API on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const response = await authenticatedFetch('/api/cart');
        
        if (!response.ok) {
          // If unauthorized, try loading from localStorage as fallback
          if (response.status === 401) {
            if (typeof window !== 'undefined') {
              const savedCart = localStorage.getItem('cart');
              if (savedCart) {
                try {
                  const cartItems = JSON.parse(savedCart);
                  dispatch({ type: 'SET_CART', payload: cartItems });
                } catch (error) {
                  console.error('Error loading cart from localStorage:', error);
                  dispatch({ type: 'SET_LOADING', payload: false });
                }
              } else {
                dispatch({ type: 'SET_LOADING', payload: false });
              }
            }
            return;
          }
          throw new Error('Failed to fetch cart');
        }

        const data = await response.json();
        
        if (data.success && data.data?.cart) {
          // Transform API response to CartItem format
          const cartItems = transformCartItems(data.data.cart.items);
          dispatch({ type: 'SET_CART', payload: cartItems });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              const cartItems = JSON.parse(savedCart);
              dispatch({ type: 'SET_CART', payload: cartItems });
            } catch (parseError) {
              console.error('Error loading cart from localStorage:', parseError);
              dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
            }
          } else {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
          }
        }
      }
    };

    fetchCart();
  }, []);

  // Sync cart to localStorage when items change
  useEffect(() => {
    dispatch({ type: 'SYNC_CART' });
  }, [state.items]);

  // API functions
  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const cartItem: CartItem = {
        ...item,
        id: `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`,
      };

      dispatch({ type: 'ADD_ITEM', payload: cartItem });
      
      // Call API to sync with server
      const response = await authenticatedFetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }

      // Fetch updated cart from server to ensure sync
      const cartResponse = await authenticatedFetch('/api/cart');
      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        if (cartData.success && cartData.data?.cart) {
          const cartItems = transformCartItems(cartData.data.cart.items);
          dispatch({ type: 'SET_CART', payload: cartItems });
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });

      toast({
        title: 'Added to Cart',
        description: `${item.name} has been added to your cart`,
        type: 'success',
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        type: 'error',
      });
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
      
      // Call API to sync with server
      await authenticatedFetch(`/api/cart/items/${id}`, {
        method: 'DELETE',
      });

      // Fetch updated cart from server to ensure sync
      const cartResponse = await authenticatedFetch('/api/cart');
      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        if (cartData.success && cartData.data?.cart) {
          const cartItems = transformCartItems(cartData.data.cart.items);
          dispatch({ type: 'SET_CART', payload: cartItems });
        }
      }

      toast({
        title: 'Removed from Cart',
        description: 'Item has been removed from your cart',
        type: 'success',
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' });
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart. Please try again.',
        type: 'error',
      });
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
      
      // Call API to sync with server
      await authenticatedFetch(`/api/cart/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      // Fetch updated cart from server to ensure sync
      const cartResponse = await authenticatedFetch('/api/cart');
      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        if (cartData.success && cartData.data?.cart) {
          const cartItems = transformCartItems(cartData.data.cart.items);
          dispatch({ type: 'SET_CART', payload: cartItems });
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
      toast({
        title: 'Error',
        description: 'Failed to update quantity. Please try again.',
        type: 'error',
      });
    }
  };

  const clearCart = async () => {
    try {
      // Call API to clear cart on server
      const response = await authenticatedFetch('/api/cart', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      // Clear local state immediately after successful API response
      dispatch({ type: 'CLEAR_CART' });
      // Sync localStorage
      dispatch({ type: 'SYNC_CART' });

      toast({
        title: 'Cart Cleared',
        description: 'Your cart has been cleared',
        type: 'success',
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
      toast({
        title: 'Error',
        description: 'Failed to clear cart. Please try again.',
        type: 'error',
      });
    }
  };

  const getItemQuantity = (productId: string, size?: string, color?: string): number => {
    const item = state.items.find(
      item => item.productId === productId && 
              item.size === size && 
              item.color === color
    );
    return item?.quantity || 0;
  };

  const isInCart = (productId: string, size?: string, color?: string): boolean => {
    return state.items.some(
      item => item.productId === productId && 
              item.size === size && 
              item.color === color
    );
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
