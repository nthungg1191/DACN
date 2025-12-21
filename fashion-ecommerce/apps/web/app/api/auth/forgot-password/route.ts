import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email to user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Always return success to prevent email enumeration
    // Don't reveal if email exists or not
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.',
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password-reset' },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '10m' }
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, user.name || 'User', resetToken);
    } catch (emailError) {
      console.error('Lỗi khi gửi email đặt lại mật khẩu:', emailError);
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.',
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

    console.error('Lỗi khi xử lý yêu cầu quên mật khẩu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}

