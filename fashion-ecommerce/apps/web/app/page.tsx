'use client';

import { Button } from '@repo/ui';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { ProductGrid } from '@/components/products/ProductGrid';
import { HeroSlider } from '@/components/HeroSlider';
import { useEffect } from 'react';
import { ShoppingBag, Shield, RefreshCw, Sparkles, TrendingUp, Clock } from 'lucide-react';

export default function Home() {
  const { 
    featuredProducts, 
    newProducts, 
    saleProducts, 
    isLoading,
    fetchFeaturedProducts,
    fetchNewProducts,
    fetchSaleProducts
  } = useApp();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchNewProducts();
    fetchSaleProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hero slides data
  const heroSlides = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80',
      subtitle: 'Bộ sưu tập mùa hè 2024',
      title: 'Thời trang hiện đại, phong cách trẻ trung',
      buttonText: 'Mua sắm ngay',
      buttonLink: '/products',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80',
      subtitle: 'Xu hướng mới nhất',
      title: 'Khám phá phong cách của bạn',
      buttonText: 'Xem bộ sưu tập',
      buttonLink: '/categories',
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&q=80',
      subtitle: 'Sale đặc biệt',
      title: 'Giảm giá lên đến 50%',
      buttonText: 'Xem sản phẩm giảm giá',
      buttonLink: '/products?sort=discount',
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
      subtitle: 'Sản phẩm mới về',
      title: 'Những mẫu thiết kế độc quyền',
      buttonText: 'Khám phá ngay',
      buttonLink: '/products?sort=newest',
    },
  ];

  

  return (
    
    
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
      {/* Subtle background pattern for entire page - Multi-color gradient */}
      <div className="fixed inset-0 bg-dots-gradient opacity-60 pointer-events-none"></div>
      <div className="fixed inset-0 bg-blend-soft opacity-30 pointer-events-none"></div>
      
      {/* Hero Section with Slider */}
      <HeroSlider 
        slides={heroSlides}
        autoPlayInterval={5000}
        className="relative"
      />

      {/* Features Section */}
      <section className="container-custom py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-dots-rose opacity-15 pointer-events-none"></div>
        <div className="grid gap-8 md:grid-cols-3 animate-fade-in">
          <div className="card group p-8 hover-lift text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">🚚 Giao hàng miễn phí</h3>
            <p className="text-muted-foreground">
              Miễn phí vận chuyển cho đơn hàng trên 500.000đ
            </p>
          </div>
          <div className="card group p-8 hover-lift text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">🔒 Thanh toán an toàn</h3>
            <p className="text-muted-foreground">
              Bảo mật thông tin thanh toán của bạn với công nghệ mã hóa tiên tiến
            </p>
          </div>
          <div className="card group p-8 hover-lift text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">↩️ Đổi trả dễ dàng</h3>
            <p className="text-muted-foreground">
              Đổi trả trong vòng 30 ngày nếu không hài lòng
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container-custom py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-cross-elegant opacity-50 pointer-events-none"></div>
        <div className="absolute inset-0 bg-dots-lavender opacity-20 pointer-events-none"></div>
        <div className="mb-12 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Sản phẩm nổi bật</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Sản phẩm <span className="gradient-text">nổi bật</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Khám phá những sản phẩm được yêu thích nhất của chúng tôi
          </p>
        </div>
        <ProductGrid
          products={featuredProducts}
          loading={isLoading}
          columns={4}
          className="mb-12"
        />
        <div className="text-center animate-fade-in">
          <Link href="/products">
            <Button 
              variant="outline" 
              size="lg"
              className="hover-lift"
            >
              Xem tất cả sản phẩm
              <TrendingUp className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* New Products */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-waves-peach opacity-40 pointer-events-none"></div>
        <div className="absolute inset-0 bg-dots-mint opacity-20 pointer-events-none"></div>
        <div className="container-custom relative">
          <div className="mb-12 text-center animate-fade-in-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Clock className="h-4 w-4" />
              <span>Mới về</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
              Sản phẩm <span className="gradient-text">mới nhất</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              Cập nhật những xu hướng thời trang mới nhất mỗi tuần
            </p>
          </div>
          <ProductGrid
            products={newProducts}
            loading={isLoading}
            columns={4}
            className="mb-12"
          />
        </div>
      </section>

      {/* Sale Products */}
      <section className="container-custom py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-zigzag-amber opacity-35 pointer-events-none"></div>
        <div className="absolute inset-0 bg-dots-peach opacity-25 pointer-events-none"></div>
        <div className="mb-12 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
            <span>Khuyến mãi đặc biệt</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Sản phẩm <span>giảm giá</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Cơ hội mua sắm với giá ưu đãi - Không nên bỏ lỡ!
          </p>
        </div>
        <ProductGrid
          products={saleProducts}
          loading={isLoading}
          columns={4}
          className="mb-12"
        />
      </section>
    </div>
  );
}