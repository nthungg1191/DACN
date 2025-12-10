import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const signInSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signInSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        image: true,
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email hoặc mật khẩu không chính xác',
        },
        { status: 401 }
      );
    }

    // Check if user has password (not OAuth only user)
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản này không có mật khẩu. Vui lòng đăng nhập bằng phương thức khác.',
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email hoặc mật khẩu không chính xác',
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Return user data (without password)
    return NextResponse.json(
      {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          },
          token, // Also return token for client-side storage if needed
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Sign in error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi khi đăng nhập',
      },
      { status: 500 }
    );
  }
}

