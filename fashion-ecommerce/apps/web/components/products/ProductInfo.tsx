'use client';

import { useState, useEffect } from 'react';
import { Star, Heart, ShoppingCart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getColorHex } from '@/lib/utils/color-mapper';

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  available: boolean;
  quantity?: number;
  price?: number;
}

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    rating: number;
    reviewCount: number;
    description: string;
    shortDescription?: string;
    inStock: boolean;
    stockCount?: number;
    sku?: string;
    brand?: string;
    category?: string;
    tags?: string[];
    variants?: {
      sizes?: ProductVariant[]; // legacy (not used when colors->sizes provided)
      colors?: (ProductVariant & { hex?: string; images?: string[]; sizes?: ProductVariant[] })[];
    };
  };
  onAddToCart: (productId: string, quantity: number, variant?: any) => void;
  onAddToWishlist: (productId: string) => void;
  onShare: (productId: string) => void;
  onColorChange?: (colorName: string) => void;
  className?: string;
}

export function ProductInfo({ 
  product, 
  onAddToCart, 
  onAddToWishlist, 
  onShare, 
  onColorChange,
  className 
}: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = () => {
    const variant = {
      size: selectedSize,
      color: selectedColor,
      price: currentPrice,
    };
    onAddToCart(product.id, quantity, variant);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onAddToWishlist(product.id);
  };

  const handleShare = () => {
    onShare(product.id);
  };

  const sizesForSelectedColor =
    product.variants?.colors?.find((c) => c.name === selectedColor)?.sizes || [];

  const selectedSizeObj = sizesForSelectedColor.find((s) => s.value === selectedSize);
  const availableQuantity = selectedSizeObj?.quantity ?? 0;
  const isInStock = availableQuantity > 0;
  const hasColors = (product.variants?.colors?.length || 0) > 0;
  const isColorSelected = !hasColors || !!selectedColor;

  const currentPrice = selectedSizeObj?.price ?? product.price;
  const discountPercentage =
    product.originalPrice && product.originalPrice > currentPrice
      ? Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100)
      : 0;

  // Auto-select first available color (so color/size info is captured for cart)
  useEffect(() => {
    if (hasColors && !selectedColor && product.variants?.colors?.length) {
      const firstAvailable = product.variants.colors.find((c) => c.available) || product.variants.colors[0];
      if (firstAvailable) {
        setSelectedColor(firstAvailable.name);
        onColorChange?.(firstAvailable.name);
      }
    }
  }, [hasColors, product.variants?.colors, selectedColor, onColorChange]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        {/* Brand */}
        {product.brand && (
          <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
        )}
        
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {product.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating} ({product.reviewCount} đánh giá)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl font-bold text-gray-900">
            ${currentPrice.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > currentPrice && (
            <>
              <span className="text-xl text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
              <Badge variant="destructive" className="text-sm">
                -{discountPercentage}%
              </Badge>
            </>
          )}
        </div>

        {/* Short Description */}
        {/* No short description per request */}
      </div>

      {/* Variants */}
      {product.variants && (
        <div className="space-y-4">
          {/* Sizes */}
          {sizesForSelectedColor.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Kích cỡ</h3>
              <div className="flex flex-wrap gap-2">
                {sizesForSelectedColor.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.value)}
                    disabled={!size.available}
                    className={cn(
                      'px-3 py-2 text-sm border rounded-md transition-colors',
                      selectedSize === size.value
                        ? 'border-primary bg-primary text-white'
                        : size.available
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.variants.colors && product.variants.colors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Màu sắc</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.colors.map((color) => {
                  // Debug: log color info in development
                  if (process.env.NODE_ENV === 'development' && color.name?.toLowerCase().includes('đen')) {
                    console.log('Color debug:', { name: color.name, hex: color.hex, available: color.available });
                  }
                  
                  const colorHex = getColorHex(color.name, color.hex);
                  const isLightColor = colorHex === '#FFFFFF' || colorHex === '#FFFBEB' || colorHex === '#FEF3C7';
                  const isDarkColor = colorHex === '#000000' || colorHex === '#1e3a8a' || colorHex === '#92400E';
                  const isSelected = selectedColor === color.name;
                  
                  return (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColor(color.name);
                        setSelectedSize('');
                        onColorChange?.(color.name);
                      }}
                      disabled={!color.available}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all relative',
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2'
                          : color.available
                          ? 'hover:scale-110'
                          : 'opacity-50 cursor-not-allowed',
                        isLightColor && !isSelected
                          ? 'border-gray-300'
                          : isSelected
                          ? 'border-primary'
                          : isDarkColor
                          ? 'border-gray-400'
                          : 'border-gray-200'
                      )}
                      style={{ 
                        backgroundColor: colorHex,
                        opacity: color.available ? 1 : 0.5,
                      }}
                      title={color.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={cn(
                            "w-3 h-3 rounded-full border",
                            isDarkColor 
                              ? "bg-white border-gray-400" 
                              : "bg-white border-gray-300"
                          )} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {!isColorSelected && (
                <p className="text-xs text-red-600 mt-1">Vui lòng chọn màu sắc</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Số lượng</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            -
          </Button>
          <span className="w-12 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(quantity + 1)}
            disabled={!product.inStock}
          >
            +
          </Button>
        </div>
      </div>

      {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {isInStock ? (
              <span className="text-sm text-green-600 font-medium">
                Còn hàng ({availableQuantity} sản phẩm)
              </span>
            ) : (
              <span className="text-sm text-red-600 font-medium">
                {!selectedSize ? 'Chọn kích cỡ' : 'Hết hàng'}
              </span>
            )}
          </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex space-x-3">
            <Button
              data-testid="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={!selectedSize || !isInStock || !isColorSelected}
              className="flex-1"
              size="lg"
            >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Thêm vào giỏ
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleWishlist}
            className={cn(
              'px-3',
              isWishlisted && 'text-red-500 border-red-500'
            )}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
            className="px-3"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Truck className="w-4 h-4" />
          <span>Miễn phí vận chuyển trên mọi đơn hàng</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Bảo hành 2 năm</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <RotateCcw className="w-4 h-4" />
          <span>30 ngày đổi trả</span>
        </div>
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Thẻ</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* SKU */}
      {product.sku && (
        <div className="text-sm text-gray-500">
          SKU: {product.sku}
        </div>
      )}
    </div>
  );
}
