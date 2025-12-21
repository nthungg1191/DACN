import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      ) as any;
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token không hợp lệ hoặc đã hết hạn',
          message: 'Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.',
        },
        { status: 400 }
      );
    }

    // Check token type
    if (decoded.type !== 'password-reset') {
      return NextResponse.json(
        {
          success: false,
          error: 'Token không hợp lệ',
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Người dùng không tồn tại',
        },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Lỗi khi đặt lại mật khẩu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}

