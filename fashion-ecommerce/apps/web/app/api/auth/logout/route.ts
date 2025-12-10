import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear auth token cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    return NextResponse.json(
      {
        success: true,
        message: 'Đăng xuất thành công',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi khi đăng xuất',
      },
      { status: 500 }
    );
  }
}

