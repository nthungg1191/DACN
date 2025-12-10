'use client';

import { useState } from 'react';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product as ProductType } from '@/types/product';

type RelatedProduct = Partial<Omit<ProductType, 'category' | 'images'>> & {
  id: string;
  name: string;
  price: number;
  images?: string[];
  image?: string;
  category?: string | ProductType['category'];
};

interface RelatedProductsProps {
  products: RelatedProduct[];
  title?: string;
  className?: string;
}

const FALLBACK_IMAGE = '/images/products/product-placeholder.jpg';
const FALLBACK_DATE = '2024-01-01T00:00:00.000Z';

function toProductCardData(product: RelatedProduct): ProductType {
  const categoryValue =
    typeof product.category === 'string'
      ? {
          id: product.category,
          name: product.category,
          slug: product.category.toLowerCase().replace(/\s+/g, '-'),
        }
      : product.category;

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [FALLBACK_IMAGE];

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? '',
    price: product.price,
    originalPrice: product.originalPrice,
    images,
    category: categoryValue,
    brand: product.brand,
    sizes: product.sizes ?? [],
    colors: product.colors ?? [],
    inStock: product.inStock ?? true,
    isNew: product.isNew ?? false,
    isFeatured: product.isFeatured ?? false,
    isOnSale: product.isOnSale ?? Boolean(product.originalPrice && product.originalPrice > product.price),
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    tags: product.tags ?? [],
    createdAt: product.createdAt ?? FALLBACK_DATE,
    updatedAt: product.updatedAt ?? FALLBACK_DATE,
  };
}

export function RelatedProducts({
  products,
  title = "Sản phẩm liên quan",
  className
}: RelatedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 4
  };

  const maxIndex = Math.max(0, products.length - itemsPerView.desktop);

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setIsTransitioning(true);
      setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setIsTransitioning(true);
      setCurrentIndex(prev => Math.max(prev - 1, 0));
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        
        {/* Navigation */}
        {products.length > itemsPerView.desktop && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={!canGoPrev}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={!canGoNext}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="relative overflow-hidden">
        <div
          className={cn(
            'flex transition-transform duration-300 ease-in-out',
            isTransitioning && 'transition-none'
          )}
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView.desktop)}%)`
          }}
        >
          {products.map((product) => {
            const cardProduct = toProductCardData(product);
            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 px-2"
              >
                <ProductCard
                  product={cardProduct}
                  className="h-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      {products.length > itemsPerView.desktop && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(index);
                setTimeout(() => setIsTransitioning(false), 300);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                currentIndex === index
                  ? 'bg-primary'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
            />
          ))}
        </div>
      )}

      {/* View All Button */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Xem tất cả {title}
        </Button>
      </div>
    </div>
  );
}

