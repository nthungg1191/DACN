import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const createCouponSchema = z.object({
  code: z.string().min(1, 'Mã giảm giá là bắt buộc').max(50, 'Mã giảm giá quá dài'),
  type: z.enum(['PERCENTAGE', 'FIXED'], {
    errorMap: () => ({ message: 'Loại giảm giá phải là PERCENTAGE hoặc FIXED' }),
  }),
  value: z.number().min(0.01, 'Giá trị giảm giá phải lớn hơn 0'),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscountAmount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  active: z.boolean().default(true),
  description: z.string().optional().nullable(),
});

const updateCouponSchema = createCouponSchema.partial();

// GET /api/admin/coupons - List coupons
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const where: any = {};

    if (search) {
      where.code = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    const skip = (page - 1) * limit;

    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy danh sách mã giảm giá' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create coupon
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsedData = createCouponSchema.parse(body);

    // Validate dates
    const validFrom = new Date(parsedData.validFrom);
    const validUntil = new Date(parsedData.validUntil);

    if (validUntil <= validFrom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ngày kết thúc phải sau ngày bắt đầu',
        },
        { status: 400 }
      );
    }

    // Validate value based on type
    if (parsedData.type === 'PERCENTAGE' && parsedData.value > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Giảm giá theo % không được vượt quá 100%',
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: parsedData.code.toUpperCase().trim() },
    });

    if (existingCoupon) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá đã tồn tại',
        },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: parsedData.code.toUpperCase().trim(),
        type: parsedData.type,
        value: parsedData.value,
        minOrderAmount: parsedData.minOrderAmount || null,
        maxDiscountAmount: parsedData.maxDiscountAmount || null,
        usageLimit: parsedData.usageLimit || null,
        validFrom,
        validUntil,
        active: parsedData.active,
        description: parsedData.description || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: coupon,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi tạo mã giảm giá' },
      { status: 500 }
    );
  }
}

