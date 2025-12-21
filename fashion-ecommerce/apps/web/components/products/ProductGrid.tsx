'use client';

import React from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const gridCols = {
  2: 'grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
};

export function ProductGrid({ 
  products, 
  loading = false, 
  columns = 4, 
  className = '' 
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
        {[...Array(8)].map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Không tìm thấy sản phẩm</div>
        <p className="text-gray-400">Hãy thử tìm kiếm lại hoặc lọc theo tiêu chí khác</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200 rounded-t-lg animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="flex items-center gap-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full" />
      </div>
    </div>
  );
}