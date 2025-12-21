import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser } from '@/lib/auth-server';
import { z } from 'zod';

const applyCouponSchema = z.object({
  code: z.string().min(1, 'Mã giảm giá là bắt buộc'),
  subtotal: z.number().min(0, 'Tổng tiền phải lớn hơn 0'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { code, subtotal } = applyCouponSchema.parse(body);

    // Tìm coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
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

    // Kiểm tra coupon có active không
    if (!coupon.active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá đã bị vô hiệu hóa',
        },
        { status: 400 }
      );
    }

    // Kiểm tra thời gian hiệu lực
    const now = new Date();
    if (now < coupon.validFrom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá chưa có hiệu lực',
        },
        { status: 400 }
      );
    }

    if (now > coupon.validUntil) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá đã hết hạn',
        },
        { status: 400 }
      );
    }

    // Kiểm tra số lần sử dụng
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã giảm giá đã hết lượt sử dụng',
        },
        { status: 400 }
      );
    }

    // Kiểm tra đơn hàng tối thiểu
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: `Đơn hàng tối thiểu ${Number(coupon.minOrderAmount).toLocaleString('vi-VN')}đ để sử dụng mã này`,
        },
        { status: 400 }
      );
    }

    // Tính toán discount
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = subtotal * (Number(coupon.value) / 100);
      // Áp dụng maxDiscountAmount nếu có
      if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
        discount = Number(coupon.maxDiscountAmount);
      }
    } else if (coupon.type === 'FIXED') {
      discount = Number(coupon.value);
      // Không được giảm quá subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discount: Math.round(discount),
        description: coupon.description,
      },
    });
  } catch (error) {
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

    console.error('Error applying coupon:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi khi áp dụng mã giảm giá',
      },
      { status: 500 }
    );
  }
}

