import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fashion.com' },
    update: {},
    create: {
      email: 'admin@fashion.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create customer user
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Test Customer',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  console.log('✅ Customer user created:', customer.email);

  // Create categories
  const menCategory = await prisma.category.upsert({
    where: { slug: 'men' },
    update: {},
    create: {
      name: 'Nam',
      slug: 'men',
      description: 'Thời trang nam',
      image: '/images/categories/men.jpg',
    },
  });

  const womenCategory = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: {
      name: 'Nữ',
      slug: 'women',
      description: 'Thời trang nữ',
      image: '/images/categories/women.jpg',
    },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Phụ kiện',
      slug: 'accessories',
      description: 'Phụ kiện thời trang',
      image: '/images/categories/accessories.jpg',
    },
  });

  console.log('✅ Categories created');

  // Create sample products
  const products = [
    {
      name: 'Áo thun nam basic',
      slug: 'ao-thun-nam-basic',
      description: 'Áo thun nam chất liệu cotton 100%, form regular fit thoải mái',
      price: 299000,
      comparePrice: 399000,
      sku: 'TSM001',
      quantity: 50,
      images: ['/images/products/tshirt-men-1.jpg'],
      featured: true,
      published: true,
      categoryId: menCategory.id,
    },
    {
      name: 'Quần jean nam slim fit',
      slug: 'quan-jean-nam-slim-fit',
      description: 'Quần jean nam form slim fit, chất liệu denim co giãn nhẹ',
      price: 599000,
      comparePrice: 799000,
      sku: 'JNM001',
      quantity: 30,
      images: ['/images/products/jeans-men-1.jpg'],
      featured: true,
      published: true,
      categoryId: menCategory.id,
    },
    {
      name: 'Váy maxi nữ',
      slug: 'vay-maxi-nu',
      description: 'Váy maxi nữ dáng dài thanh lịch, chất liệu voan mềm mại',
      price: 699000,
      comparePrice: 899000,
      sku: 'VXN001',
      quantity: 25,
      images: ['/images/products/dress-women-1.jpg'],
      featured: true,
      published: true,
      categoryId: womenCategory.id,
    },
    {
      name: 'Túi xách nữ da PU',
      slug: 'tui-xach-nu-da-pu',
      description: 'Túi xách nữ chất liệu da PU cao cấp, nhiều ngăn tiện lợi',
      price: 450000,
      comparePrice: 600000,
      sku: 'TXN001',
      quantity: 40,
      images: ['/images/products/bag-women-1.jpg'],
      featured: true,
      published: true,
      categoryId: accessoriesCategory.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log('✅ Sample products created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

