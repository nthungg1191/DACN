import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';
// GET /api/addresses/[id] - Get address by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { id } = await context.params;

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'địa chỉ không tồn tại',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
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

// PUT /api/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Check if address exists and belongs to user
    const { id } = await context.params;

    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'địa chỉ không tồn tại',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const addressSchema = z.object({
      fullName: z.string().min(1, 'tên đầy đủ là bắt buộc').optional(),
      phone: z.string().min(10, 'số điện thoại phải có ít nhất 10 chữ số'),
      street: z.string().min(1, 'địa chỉ là bắt buộc').optional(),
      city: z.string().min(1, 'thành phố là bắt buộc').optional(),
      state: z.string().min(1, 'tỉnh/thành phố là bắt buộc').optional(),
      postalCode: z.string().min(1, 'mã bưu điện là bắt buộc').optional(),
      country: z.string().min(1, 'quốc gia là bắt buộc').optional(),
      isDefault: z.boolean().optional(),
    });

    const addressData = addressSchema.parse(body);

    // If this is set as default, unset all other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.update({
      where: {
        id,
      },
      data: addressData,
    });

    return NextResponse.json({
      success: true,
      data: address,
      message: 'địa chỉ đã được cập nhật thành công',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'lỗi khi cập nhật địa chỉ',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('lỗi khi cập nhật địa chỉ:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'lỗi khi cập nhật địa chỉ',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id] - Delete address
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Check if address exists and belongs to user
    const { id } = await context.params;

    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'địa chỉ không tồn tại',
        },
        { status: 404 }
      );
    }

    await prisma.address.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'địa chỉ đã được xóa thành công',
    });
  } catch (error) {
    console.error('lỗi khi xóa địa chỉ:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'lỗi khi xóa địa chỉ',
      },
      { status: 500 }
    );
  }
}

