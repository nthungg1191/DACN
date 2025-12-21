import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware bảo vệ các route /admin và /api/admin
 * - Gắn header x-pathname để server component đọc được pathname hiện tại
 * - Chặn truy cập nếu không đăng nhập hoặc không phải ADMIN
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();

  // Luôn gắn pathname để layout server-side có thể đọc
  response.headers.set('x-pathname', pathname);

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin');

  // Bỏ qua nếu không phải admin route hoặc là trang login admin
  if ((!isAdminPage && !isAdminApi) || isAdminLoginPage) {
    return response;
  }

  // Lấy token từ NextAuth (JWT strategy)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = (token as any)?.role;

  // Chưa đăng nhập
  if (!token) {
    if (isAdminApi) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const callbackUrl = encodeURIComponent(pathname || '/admin/dashboard');
    return NextResponse.redirect(
      new URL(`/admin/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  // Không phải ADMIN
  if (role !== 'ADMIN') {
    if (isAdminApi) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

