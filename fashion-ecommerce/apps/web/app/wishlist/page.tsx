'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useToast } from '@/components/ui/useToast';
import Image from 'next/image';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useApp();
  const toast = (useToast() as any).toast;

  const handleRemoveItem = async (id: string, name: string) => {
    await removeFromWishlist(id);
    toast({
      title: 'Removed from Wishlist',
      description: `${name} has been removed from your wishlist`,
      type: 'success',
    });
  };

  const handleClearWishlist = async () => {
    const confirmed = window.confirm('Are you sure you want to clear your wishlist?');
    if (confirmed) {
      await clearWishlist();
      toast({
        title: 'Wishlist Cleared',
        description: 'All items have been removed from your wishlist',
        type: 'success',
      });
    }
  };

  if (wishlist.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist.items || wishlist.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h1>
          <p className="text-gray-600 mb-8">
            Save your favorite products here to view them later.
          </p>
          <Link href="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">
              {wishlist.totalItems} {wishlist.totalItems === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <button
            onClick={handleClearWishlist}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition"
          >
            Clear Wishlist
          </button>
        </div>
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.items.map((item) => (
          <div key={item.id} className="group relative">
            {/* Remove Button */}
            <button
              onClick={() => handleRemoveItem(item.id, item.name)}
              className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              aria-label="Remove from wishlist"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Product Card */}
            <Link href={`/products/${item.productId}`} className="block h-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                {/* Image */}
                <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                  <Image
                    src={item.image || '/images/products/product-placeholder.jpg'}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.featured && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition">
                      {item.name}
                    </h3>
                    {item.category && (
                      <p className="text-sm text-gray-500">{item.category}</p>
                    )}
                  </div>

                  <div className="mt-auto">
                    {/* Rating */}
                    {item.rating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(item.rating) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({item.reviewCount || 0})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.price)}
                      </span>
                      {item.comparePrice && item.comparePrice > item.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.comparePrice)}
                        </span>
                      )}
                    </div>

                    {/* In Stock Badge */}
                    {item.inStock ? (
                      <span className="text-xs text-green-600 font-medium mt-1">In Stock</span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium mt-1">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Continue Shopping */}
      <div className="mt-12 text-center">
        <Link href="/products">
          <Button variant="outline" size="lg">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
