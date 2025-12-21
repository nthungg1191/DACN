import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

// GET /api/addresses - Get user's addresses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }
    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('lỗi khi lấy địa chỉ:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'lỗi khi lấy địa chỉ',
      },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }
    const body = await request.json();
    const addressSchema = z.object({
      fullName: z.string().min(1, 'Full name is required'),
      phone: z.string().min(10, 'số điện thoại phải có ít nhất 10 chữ số'),
      street: z.string().min(1, 'địa chỉ là bắt buộc'),
      city: z.string().min(1, 'thành phố là bắt buộc'),
      state: z.string().min(1, 'tỉnh/thành phố là bắt buộc'),
      postalCode: z.string().min(1, 'mã bưu điện là bắt buộc'),
      country: z.string().min(1, 'quốc gia là bắt buộc'),
      isDefault: z.boolean().optional().default(false),
    });

    const addressData = addressSchema.parse(body);

    // If this is set as default, unset all other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: address,
      message: 'địa chỉ đã được tạo thành công',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'lỗi khi tạo địa chỉ',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('lỗi khi tạo địa chỉ:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'lỗi khi tạo địa chỉ',
      },
      { status: 500 }
    );
  }
}

