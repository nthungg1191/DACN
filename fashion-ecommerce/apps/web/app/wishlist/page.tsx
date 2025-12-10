'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/useToast';
import Image from 'next/image';

const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="32" font-family="Arial, sans-serif">No Image</text></svg>';

const safeImage = (img?: string) => {
  if (!img || img.trim() === '') return DEFAULT_PLACEHOLDER;
  // Handle common mock image paths
  if (img.includes('product-placeholder') || img.includes('mock')) {
    return DEFAULT_PLACEHOLDER;
  }
  return img;
};

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useApp();
  const toast = useToast();

  const handleRemoveItem = async (id: string, name: string) => {
    await removeFromWishlist(id);
    toast.success(`${name} đã được xóa khỏi danh sách yêu thích`);
  };

  const handleClearWishlist = async () => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa danh sách yêu thích của bạn?');
    if (confirmed) {
      await clearWishlist();
      toast.success('Tất cả các sản phẩm đã được xóa khỏi danh sách yêu thích');
    }
  };

  if (wishlist.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách yêu thích...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Danh sách yêu thích của bạn trống</h1>
          <p className="text-gray-600 mb-8">
            Lưu các sản phẩm yêu thích của bạn ở đây để xem sau.
          </p>
          <Link href="/products">
            <Button size="lg">Xem sản phẩm</Button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh sách yêu thích của bạn</h1>
            <p className="text-gray-600">
              {wishlist.items.length} {wishlist.items.length === 1 ? 'sản phẩm' : 'sản phẩm'} đã lưu
            </p>
          </div>
          <button
            onClick={handleClearWishlist}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition"
          >
            Xóa danh sách yêu thích
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
                    src={safeImage(item.image)}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition">
                      {item.name}
                    </h3>
                  </div>

                  <div className="mt-auto">
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.price)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.originalPrice)}
                        </span>
                      )}
                    </div>
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
