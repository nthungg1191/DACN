import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/database';
import { ProductForm } from '@/components/admin/products/ProductForm';

export default async function AdminEditProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    const { id } = await paramsPromise;
    redirect(`/admin/login?callbackUrl=/admin/products/${id}/edit`);
  }

  const { id } = await paramsPromise;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const serializeNumber = (val: any) =>
    val && typeof val === 'object' && 'toNumber' in val ? val.toNumber() : val !== undefined ? Number(val) : val;

  const safeProduct = product
    ? {
        ...product,
        price: serializeNumber(product.price),
        comparePrice: serializeNumber(product.comparePrice),
        costPrice: serializeNumber(product.costPrice),
        variants: product.variants.map((v) => ({
          ...v,
          price: serializeNumber(v.price),
        })),
      }
    : null;

  if (!safeProduct) {
    redirect('/admin/products');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sửa sản phẩm</h1>
        <p className="text-gray-600 mt-1">Cập nhật thông tin sản phẩm</p>
      </div>

      <ProductForm product={safeProduct as any} categories={categories} />
    </div>
  );
}

