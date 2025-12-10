import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/database';
import { ProductForm } from '@/components/admin/products/ProductForm';

export default async function AdminNewProductPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/admin/login?callbackUrl=/admin/products/new');
  }

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
        <p className="text-gray-600 mt-1">Tạo sản phẩm mới cho cửa hàng</p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}

