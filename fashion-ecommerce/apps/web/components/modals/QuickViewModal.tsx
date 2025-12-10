'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@repo/types';
import { Modal } from './Modal';
import { Button } from '@repo/ui';
import { Heart, ShoppingCart, Minus, Plus } from 'lucide-react';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart?: (productId: string, quantity: number) => void;
  onAddToWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
}

export function QuickViewModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false
}: QuickViewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const DEFAULT_PLACEHOLDER =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="32" font-family="Arial, sans-serif">No Image</text></svg>';
  const safeImage = (img?: string) => {
    return img || DEFAULT_PLACEHOLDER;
  };

  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const discountPercentage = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    onAddToCart?.(product.id, quantity);
    onClose();
  };

  const handleAddToWishlist = () => {
    onAddToWishlist?.(product.id);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.quantity) {
      setQuantity(newQuantity);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="max-w-4xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square relative overflow-hidden rounded-lg">
            <Image
              src={safeImage(product.images[selectedImageIndex])}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square relative overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImageIndex === index
                      ? 'border-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={safeImage(image)}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Category */}
          {product.category && (
            <p className="text-sm text-gray-500">
              {product.category.name}
            </p>
          )}

          {/* Product Name */}
          <h1 className="text-2xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="bg-red-100 text-red-800 text-sm font-semibold px-2 py-1 rounded">
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tình trạng:</span>
            <span className={`text-sm font-medium ${
              product.quantity > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'}
            </span>
          </div>

          {/* Quantity Selector */}
          {product.quantity > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Số lượng:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.quantity}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {product.quantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleAddToWishlist}
              className={`p-3 ${
                isInWishlist 
                  ? 'bg-red-50 text-red-600 border-red-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* View Details Link */}
          <div className="pt-4 border-t border-gray-200">
            <Link
              href={`/products/${product.slug}`}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Xem chi tiết sản phẩm →
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
