import { Button } from '@repo/ui';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-bold">
          Chào mừng đến với Fashion E-commerce
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Khám phá bộ sưu tập thời trang mới nhất
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/products">
            <Button size="lg">Mua sắm ngay</Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline">
              Tìm hiểu thêm
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="mb-2 text-xl font-semibold">🚚 Giao hàng miễn phí</h3>
          <p className="text-gray-600">
            Miễn phí vận chuyển cho đơn hàng trên 500.000đ
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="mb-2 text-xl font-semibold">🔒 Thanh toán an toàn</h3>
          <p className="text-gray-600">
            Bảo mật thông tin thanh toán của bạn
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="mb-2 text-xl font-semibold">↩️ Đổi trả dễ dàng</h3>
          <p className="text-gray-600">
            Đổi trả trong vòng 30 ngày nếu không hài lòng
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Sản phẩm nổi bật
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="mb-4 aspect-square bg-gray-200"></div>
              <h4 className="mb-2 font-semibold">Sản phẩm {i}</h4>
              <p className="mb-2 text-gray-600">Mô tả ngắn</p>
              <p className="mb-4 text-lg font-bold">299.000đ</p>
              <Button className="w-full">Thêm vào giỏ</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

