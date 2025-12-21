import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().min(0.01).optional(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscountAmount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  active: z.boolean().optional(),
  description: z.string().optional().nullable(),
});

// GET /api/admin/coupons/[id] - Get coupon by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá không tồn tại',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy thông tin mã giảm giá' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/coupons/[id] - Update coupon
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsedData = updateCouponSchema.parse(body);

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: params.id },
    });

    if (!existingCoupon) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá không tồn tại',
        },
        { status: 404 }
      );
    }

    // Validate dates if provided
    if (parsedData.validFrom || parsedData.validUntil) {
      const validFrom = parsedData.validFrom
        ? new Date(parsedData.validFrom)
        : existingCoupon.validFrom;
      const validUntil = parsedData.validUntil
        ? new Date(parsedData.validUntil)
        : existingCoupon.validUntil;

      if (validUntil <= validFrom) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ngày kết thúc phải sau ngày bắt đầu',
          },
          { status: 400 }
        );
      }
    }

    // Validate value based on type
    if (parsedData.type === 'PERCENTAGE' || existingCoupon.type === 'PERCENTAGE') {
      const value = parsedData.value ?? Number(existingCoupon.value);
      if (value > 100) {
        return NextResponse.json(
          {
            success: false,
            error: 'Giảm giá theo % không được vượt quá 100%',
          },
          { status: 400 }
        );
      }
    }

    // Check if code already exists (if changing code)
    if (parsedData.code && parsedData.code.toUpperCase().trim() !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: parsedData.code.toUpperCase().trim() },
      });

      if (codeExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã giảm giá đã tồn tại',
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (parsedData.code !== undefined) {
      updateData.code = parsedData.code.toUpperCase().trim();
    }
    if (parsedData.type !== undefined) {
      updateData.type = parsedData.type;
    }
    if (parsedData.value !== undefined) {
      updateData.value = parsedData.value;
    }
    if (parsedData.minOrderAmount !== undefined) {
      updateData.minOrderAmount = parsedData.minOrderAmount;
    }
    if (parsedData.maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = parsedData.maxDiscountAmount;
    }
    if (parsedData.usageLimit !== undefined) {
      updateData.usageLimit = parsedData.usageLimit;
    }
    if (parsedData.validFrom !== undefined) {
      updateData.validFrom = new Date(parsedData.validFrom);
    }
    if (parsedData.validUntil !== undefined) {
      updateData.validUntil = new Date(parsedData.validUntil);
    }
    if (parsedData.active !== undefined) {
      updateData.active = parsedData.active;
    }
    if (parsedData.description !== undefined) {
      updateData.description = parsedData.description;
    }

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
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

    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi cập nhật mã giảm giá' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá không tồn tại',
        },
        { status: 404 }
      );
    }

    // Check if coupon has been used
    if (coupon._count.orders > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không thể xóa mã giảm giá đã được sử dụng. Vui lòng vô hiệu hóa thay vì xóa.',
        },
        { status: 400 }
      );
    }

    await prisma.coupon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa mã giảm giá thành công',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi xóa mã giảm giá' },
      { status: 500 }
    );
  }
}

