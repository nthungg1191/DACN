'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductInfo } from '@/components/products/ProductInfo';
import { ProductReviews } from '@/components/products/ProductReviews';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { useApp } from '@/hooks/useApp';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useProductReviews } from '@/hooks/useSWR';
import { Textarea } from '@repo/ui';
import { Label } from '@/components/ui/Label';
import { mapDatabaseProductToFrontend, mapDatabaseProductsToFrontend } from '@/lib/utils/product-mapper';
import { getColorHex } from '@/lib/utils/color-mapper';

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isMain?: boolean;
}

interface Product {
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
  images: ProductImage[];
  variants?: {
    sizes?: any[];
    colors?: any[];
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, addToWishlist } = useApp();
  const fallbackImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="32" font-family="Arial, sans-serif">No Image</text></svg>';

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([]);
  const [defaultGalleryImages, setDefaultGalleryImages] = useState<ProductImage[]>([]);
  const [colorImagesMap, setColorImagesMap] = useState<Record<string, { id: string; url: string; alt: string }[]>>({});
  const { data: session } = useSession();
  const productId = params.id as string;
  const { reviews, stats, isLoading: isReviewsLoading, mutate: mutateReviews } = useProductReviews(productId);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${productId}`);
        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Sản phẩm không tồn tại');
        }

        // Map database product to frontend format
        const dbProduct = result.data;
        
        // Transform to match ProductDetailPage format
        const mappedProduct = {
          id: dbProduct.id,
          name: dbProduct.name,
          price: typeof dbProduct.price === 'object' && 'toNumber' in dbProduct.price
            ? dbProduct.price.toNumber()
            : Number(dbProduct.price),
          originalPrice: dbProduct.comparePrice
            ? (typeof dbProduct.comparePrice === 'object' && 'toNumber' in dbProduct.comparePrice
                ? dbProduct.comparePrice.toNumber()
                : Number(dbProduct.comparePrice))
            : undefined,
          discount: dbProduct.comparePrice && dbProduct.price
            ? Math.round(((Number(dbProduct.comparePrice) - Number(dbProduct.price)) / Number(dbProduct.comparePrice)) * 100)
            : 0,
          rating: dbProduct.averageRating || 0,
          reviewCount: dbProduct.reviewCount || 0,
          description: dbProduct.description,
          shortDescription: dbProduct.description.substring(0, 100) + '...',
          inStock: dbProduct.quantity > 0,
          stockCount: dbProduct.quantity,
          sku: dbProduct.sku,
          brand: dbProduct.brand || '',
          category: dbProduct.category?.name || '',
          tags: dbProduct.tags || [],
          images: dbProduct.images?.map((img: string, index: number) => ({
            id: `${index + 1}`,
            url: img || fallbackImage,
            alt: `${dbProduct.name} - Image ${index + 1}`,
            isMain: index === 0,
          })) || [],
          variants: {
            sizes: [],
            colors: (() => {
              const colorMap: Record<string, { available: boolean; hex?: string; images?: string[]; sizes: any[] }> = {};
              dbProduct.variants
                ?.filter((v: any) => v.attributes?.color)
                .forEach((v: any) => {
                  const colorName = v.attributes.color;
                  const colorHexFromDb = v.attributes?.colorHex;
                  const colorHex = getColorHex(colorName, colorHexFromDb);
                  const images = Array.isArray(v.attributes?.images) ? v.attributes.images : [];
                  if (!colorMap[colorName]) {
                    colorMap[colorName] = { available: v.quantity > 0, hex: colorHex, images, sizes: [] };
                  } else {
                    colorMap[colorName].available = colorMap[colorName].available || v.quantity > 0;
                    colorMap[colorName].images = Array.from(
                      new Set([...(colorMap[colorName].images || []), ...images])
                    );
                  }
                  if (v.attributes?.size) {
                    const variantPrice = v.price?.toNumber ? v.price.toNumber() : Number(v.price);
                    colorMap[colorName].sizes.push({
                      id: `${colorName}-${v.attributes.size}`.toLowerCase().replace(/\s+/g, '-'),
                      name: v.attributes.size,
                      value: v.attributes.size,
                      quantity: v.quantity,
                      available: v.quantity > 0,
                      price: variantPrice,
                    });
                  }
                });
              return Object.entries(colorMap).map(([name, data]) => ({
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                value: name,
                hex: data.hex,
                available: data.available,
                images: data.images || [],
                sizes: data.sizes,
              }));
            })(),
          },
        };

        setProduct(mappedProduct);

        // Log product view (fire-and-forget, không chặn UI)
        fetch('/api/analytics/product-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        }).catch(() => {});
        const colorImgs: Record<string, { id: string; url: string; alt: string }[]> = {};
        (mappedProduct.variants.colors || []).forEach((c: any) => {
          if (c.images && c.images.length > 0) {
            colorImgs[c.name] = c.images.map((img: string, idx: number) => ({
              id: `${c.id}-${idx + 1}`,
              url: img || fallbackImage,
              alt: `${mappedProduct.name} - ${c.name} - ${idx + 1}`,
            }));
          }
        });
        setColorImagesMap(colorImgs);
        // Default gallery: tất cả ảnh chung + ảnh theo màu
        const combinedImages = [
          ...mappedProduct.images,
          ...Object.values(colorImgs).flat(),
        ];
        const finalDefaultImages = combinedImages.length > 0 ? combinedImages : mappedProduct.images;
        setDefaultGalleryImages(finalDefaultImages);
        setGalleryImages(finalDefaultImages);

        // Map related products
        if (result.data.relatedProducts) {
          const mappedRelated = result.data.relatedProducts.map((rp: any) => ({
            id: rp.id,
            name: rp.name,
            price: typeof rp.price === 'object' && 'toNumber' in rp.price
              ? rp.price.toNumber()
              : Number(rp.price),
            originalPrice: undefined,
            discount: undefined,
            rating: rp.averageRating || 0,
            reviewCount: rp.reviewCount || 0,
            images: (rp.images || []).map((img: string) => img || fallbackImage),
            inStock: true,
            isNew: false,
            isFeatured: rp.featured || false,
            category: '',
            brand: '',
          }));
          setRelatedProducts(mappedRelated);
        } else {
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        setError(error instanceof Error ? error.message : 'Không thể tải sản phẩm');
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const getPrimaryImage = () => {
    const firstImage = galleryImages?.[0];
    if (!firstImage) {
      return '/images/products/product-placeholder.jpg';
    }
    return typeof firstImage === 'string' ? firstImage : firstImage.url;
  };

  const handleAddToCart = async (productId: string, quantity = 1, variant?: any) => {
    if (!product) return;
    try {
      const priceToUse = variant?.price ?? product.price;
      await addToCart({
        productId,
        name: product.name,
        price: priceToUse,
        originalPrice: product.originalPrice,
        image: getPrimaryImage(),
        quantity,
        maxQuantity: product.stockCount ?? 10,
        size: variant?.size,
        color: variant?.color,
      });
      toast.success('Sản phẩm đã được thêm vào giỏ');
    } catch (error) {
      console.error('lỗi thêm sản phẩm vào giỏ:', error);
      toast.error('Lỗi thêm sản phẩm vào giỏ');
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    if (!product) return;
    try {
      await addToWishlist({
        productId,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: getPrimaryImage(),
      });
      toast.success('Sản phẩm đã được thêm vào danh sách yêu thích');
    } catch (error) {
      console.error('lỗi thêm sản phẩm vào danh sách yêu thích:', error);
      toast.error('Lỗi thêm sản phẩm vào danh sách yêu thích');
    }
  };

  const handleShare = (productId: string) => {
    if (!product) return;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription || product.description.substring(0, 100),
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Liên kết đã được sao chép vào clipboard');
    }
  };

  const handleLoadMoreReviews = () => {
    // Có thể triển khai phân trang sau
    toast.info('Đang tải thêm đánh giá...', {
      description: 'Vui lòng đợi trong giây lát',
    });
  };

  const handleSubmitReview = async () => {
    if (!productId) return;

    // Inline validation
    const newRatingError =
      !rating || rating < 1 || rating > 5
        ? 'Vui lòng chọn số sao từ 1 đến 5 trước khi gửi đánh giá.'
        : null;
    const newCommentError =
      comment.length > 2000 ? 'Nhận xét quá dài (tối đa 2000 ký tự).' : null;

    setRatingError(newRatingError);
    setCommentError(newCommentError);

    if (newRatingError || newCommentError) {
      if (newRatingError) {
        toast.warning('Thiếu thông tin đánh giá', { description: newRatingError });
      } else if (newCommentError) {
        toast.warning('Nhận xét không hợp lệ', { description: newCommentError });
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle different error types
        if (response.status === 400) {
          if (data.error?.includes('đã đánh giá')) {
            toast.warning('Bạn đã đánh giá sản phẩm này', {
              description: 'Mỗi sản phẩm chỉ có thể đánh giá một lần',
            });
          } else if (data.error?.includes('nhận hàng')) {
            toast.warning('Chưa thể đánh giá', {
              description: 'Bạn cần đã nhận hàng (trạng thái DELIVERED) để đánh giá sản phẩm này',
            });
          } else if (data.error?.includes('Dữ liệu không hợp lệ')) {
            toast.error('Dữ liệu không hợp lệ', {
              description: 'Vui lòng kiểm tra lại thông tin đánh giá của bạn',
            });
          } else {
            toast.error(data.error || 'Không thể gửi đánh giá', {
              description: 'Vui lòng thử lại sau',
            });
          }
        } else if (response.status === 401) {
          toast.error('Chưa đăng nhập', {
            description: 'Vui lòng đăng nhập để đánh giá sản phẩm',
          });
        } else {
          toast.error('Có lỗi xảy ra', {
            description: data.error || 'Không thể gửi đánh giá. Vui lòng thử lại sau',
          });
        }
        return;
      }

      // Success
      toast.success('Đánh giá đã được gửi thành công!', {
        description: data.message || 'Cảm ơn bạn đã đánh giá sản phẩm. Đánh giá của bạn sẽ được hiển thị ngay.',
        duration: 4000,
      });
      
      setComment('');
      setRating(5);
      
      // Force revalidate reviews to show the new review immediately
      await mutateReviews();
    } catch (error: any) {
      toast.error('Lỗi kết nối', {
        description: error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h1>
            <p className="text-gray-600 mb-6">{error || 'Sản phẩm không tồn tại hoặc đã bị xóa'}</p>
            <Button onClick={() => router.push('/products')}>
              Xem tất cả sản phẩm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const mappedReviews = (reviews || []).map((r: any) => ({
    id: r.id,
    user: {
      name: r.user?.name || 'Người dùng',
      avatar: r.user?.avatar,
      verified: true,
    },
    rating: r.rating,
    title: '',
    comment: r.comment || '',
    date: r.createdAt,
    helpful: r.helpful || 0,
    verified: true,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Gallery */}
          <ProductGallery
            images={galleryImages}
            productName={product.name}
          />

          {/* Product Info */}
          <ProductInfo
            product={product}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onShare={handleShare}
          onColorChange={(colorName) => {
            const colorImgs = colorImagesMap[colorName] || [];
            if (colorImgs.length === 0) {
              setGalleryImages(defaultGalleryImages);
              return;
            }
            const seen = new Set<string>();
            const merged = [
              ...colorImgs,
              ...defaultGalleryImages,
            ].filter((img) => {
              const key = typeof img === 'string' ? img : img.url || img.id;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            setGalleryImages(merged);
          }}
          />
        </div>

        {/* Product Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'description', label: 'Description' },
                    { id: 'reviews', label: `Reviews (${stats.totalReviews || 0})` },
                { id: 'shipping', label: 'Shipping & Returns' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Review form */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h3 className="text-lg font-semibold mb-3">Viết đánh giá</h3>
                  {session ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm text-gray-700">Đánh giá</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={`p-1 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">{rating}/5</span>
                      </div>
                      {ratingError && (
                        <p className="text-xs text-red-500 mt-1">{ratingError}</p>
                      )}

                      <div className="space-y-1">
                        <Label htmlFor="comment" className="text-sm text-gray-700">
                          Nhận xét (tuỳ chọn)
                        </Label>
                        <Textarea
                          id="comment"
                          value={comment}
                          onChange={(e) => {
                            const value = e.target.value;
                            setComment(value);
                            if (commentError && value.length <= 2000) {
                              setCommentError(null);
                            }
                          }}
                          placeholder="Chia sẻ trải nghiệm sản phẩm..."
                          rows={4}
                        />
                        {commentError && (
                          <p className="text-xs text-red-500 mt-1">{commentError}</p>
                        )}
                      </div>

                      <Button onClick={handleSubmitReview} disabled={submitting} className="mt-1">
                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </Button>
                      <p className="text-xs text-gray-500">Yêu cầu đã nhận hàng (trạng thái giao hàng: DELIVERED)</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Vui lòng <button className="text-primary underline" onClick={() => router.push('/auth/signin')}>đăng nhập</button> để viết đánh giá.
                    </p>
                  )}
                </div>

                <ProductReviews
                  reviews={mappedReviews}
                  averageRating={stats.averageRating || 0}
                  totalReviews={stats.totalReviews || 0}
                  ratingDistribution={stats.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }}
                  onLoadMore={handleLoadMoreReviews}
                  hasMore={false}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                />
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin vận chuyển</h3>
                  <div className="space-y-3 text-gray-700">
                    <p>• Miễn phí vận chuyển trên mọi đơn hàng</p>
                    <p>• Vận chuyển tiêu chuẩn: 3-5 ngày làm việc</p>
                    <p>• Vận chuyển nhanh: 1-2 ngày làm việc</p>
                    <p>• Vận chuyển quốc tế có sẵn</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Đổi trả</h3>
                  <div className="space-y-3 text-gray-700">
                    <p>• 30 ngày đổi trả</p>
                    <p>• Miễn phí đổi trả trong vòng 30 ngày</p>
                    <p>• Sản phẩm phải còn nguyên tem, nhãn mác</p>
                    <p>• Đổi trả cho các kích cỡ khác nhau</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts
          products={relatedProducts}
          title="Bạn có thể thích"
        />
      </div>
    </div>
  );
}
