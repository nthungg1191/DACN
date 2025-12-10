/**
 * API Route: GET /api/payments/sepay/callback
 * 
 * Xử lý callback từ SePay sau khi thanh toán
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSePayClient } from '@/lib/payments/sepay/client';
import { prisma } from '@repo/database';

/**
 * Helper function để tạo redirect URL an toàn
 * Xử lý trường hợp HTTPS localhost (không có SSL) và ngrok URL
 * 
 * Logic:
 * - Production: Dùng domain production (NEXTAUTH_URL hoặc NEXT_PUBLIC_APP_URL)
 * - Development: Dùng ngrok domain từ SEPAY_RETURN_URL
 * - Fallback: Dùng origin từ request
 */
function getRedirectUrl(path: string, request: NextRequest): URL {
  const requestUrl = new URL(request.url);
  const isProduction = process.env.NODE_ENV === 'production';

  // Production: Ưu tiên dùng domain production
  if (isProduction) {
    const productionUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (productionUrl) {
      try {
        const prodUrl = new URL(productionUrl);
        return new URL(path, prodUrl.origin);
      } catch (e) {
        // Nếu URL không hợp lệ, fallback xuống dưới
      }
    }
  }

  // Development: Dùng ngrok domain từ SEPAY_RETURN_URL (nếu có)
  if (!isProduction) {
    const envReturnUrl = process.env.SEPAY_RETURN_URL;
    if (envReturnUrl) {
      try {
        const envUrl = new URL(envReturnUrl);
        const baseOrigin = envUrl.origin; // ví dụ: https://abc123.ngrok-free.app
        return new URL(path, baseOrigin);
      } catch (e) {
        // Nếu URL không hợp lệ, fallback xuống dưới
      }
    }
  }
  
  // Fallback: nếu request đến từ HTTPS localhost (không có SSL), chuyển về HTTP
  if (requestUrl.hostname === 'localhost' && requestUrl.protocol === 'https:') {
    const baseUrl = `http://${requestUrl.hostname}${requestUrl.port ? `:${requestUrl.port}` : ''}`;
    return new URL(path, baseUrl);
  }
  
  // Mặc định: dùng origin của request
  return new URL(path, requestUrl.origin);
}

export async function GET(request: NextRequest) {
  try {
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== SePay Callback Debug ===');
      console.log('Request URL:', request.url);
      console.log('Request URL pathname:', request.nextUrl.pathname);
      console.log('Request URL search:', request.nextUrl.search);
    }

    const searchParams = request.nextUrl.searchParams;

    // Lấy tất cả params từ SePay / query string
    const callbackParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Callback Params:', JSON.stringify(callbackParams, null, 2));
      console.log('Params count:', Object.keys(callbackParams).length);
    }

    // Kiểm tra có status hoặc orderNumber tối thiểu không
    if (!callbackParams.status && !callbackParams.order_id && !callbackParams.orderNumber) {
      return NextResponse.redirect(
        getRedirectUrl('/payment/failed?error=invalid_response', request)
      );
    }

    // Tạo SePay client
    const sepayClient = createSePayClient();

    // Xác thực callback
    const isValid = sepayClient.verifyCallback(callbackParams);

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Verification result:', isValid);
      console.log('signature from callback:', callbackParams.signature);
    }

    if (!isValid) {
      console.error('SePay callback verification failed:', callbackParams);
      return NextResponse.redirect(
        getRedirectUrl('/payment/failed?error=verification_failed', request)
      );
    }

    // Parse callback parameters
    const parsedCallback = sepayClient.parseCallback(callbackParams);

    if (!parsedCallback) {
      return NextResponse.redirect(
        getRedirectUrl('/payment/failed?error=invalid_callback_data', request)
      );
    }

    // Lấy order number từ callback hoặc query
    const orderNumberFromQuery =
      callbackParams.orderNumber ||
      callbackParams.order_id ||
      callbackParams.order_invoice_number ||
      callbackParams.orderId;

    const orderNumber = parsedCallback.order_invoice_number || orderNumberFromQuery;
    const transactionId = parsedCallback.transaction_id;
    const status = parsedCallback.order_status || callbackParams.status;

    // Nếu vẫn không có orderNumber thì không thể xử lý
    if (!orderNumber) {
      return NextResponse.redirect(
        getRedirectUrl('/payment/failed?error=missing_order_number', request)
      );
    }

    // Tìm order
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: orderNumber,
      },
    });

    if (!order) {
      return NextResponse.redirect(
        getRedirectUrl('/payment/failed?error=order_not_found', request)
      );
    }

    // Xử lý kết quả thanh toán
    // SePay status: 'success', 'pending', 'failed', 'canceled', 'cancel'
    if (status === 'success' || status === '00') {
      // Thanh toán thành công
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentTransactionId: transactionId,
          paymentMetadata: {
            status: status,
            transactionId: transactionId,
            callbackParams: callbackParams,
          },
        },
      });

      // Redirect đến trang thành công
      return NextResponse.redirect(
        getRedirectUrl(`/orders/${order.id}?payment=success`, request)
      );
    } else if (status === 'pending') {
      // Thanh toán đang chờ xử lý
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PENDING',
          paymentTransactionId: transactionId,
          paymentMetadata: {
            status: status,
            transactionId: transactionId,
            callbackParams: callbackParams,
          },
        },
      });

      // Redirect đến trang order với thông báo đang chờ
      return NextResponse.redirect(
        getRedirectUrl(`/orders/${order.id}?payment=pending`, request)
      );
    } else if (status === 'cancel' || status === 'canceled' || callbackParams.status === 'cancel') {
      // User đã hủy thanh toán (không phải lỗi)
      // Giữ order ở trạng thái PENDING để user có thể thử lại
      await prisma.order.update({
        where: { id: order.id },
        data: {
          // KHÔNG đổi paymentStatus, giữ nguyên PENDING
          paymentMetadata: {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            reason: 'user_cancelled',
            callbackParams: callbackParams,
          },
        },
      });

      // Redirect về order detail với thông báo hủy
      return NextResponse.redirect(
        getRedirectUrl(`/orders/${order.id}?payment=cancelled`, request)
      );
    } else {
      // Thanh toán thất bại (lỗi kỹ thuật)
      const errorMessage = parsedCallback.response_message || 'Thanh toán thất bại';

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          paymentMetadata: {
            status: status,
            transactionId: transactionId,
            errorMessage: errorMessage,
            callbackParams: callbackParams,
          },
        },
      });

      // Redirect đến trang thất bại
      return NextResponse.redirect(
        getRedirectUrl(`/payment/failed?orderId=${order.id}&error=${status}`, request)
      );
    }
  } catch (error) {
    console.error('Error processing SePay callback:', error);
    return NextResponse.redirect(
      getRedirectUrl('/payment/failed?error=internal_error', request)
    );
  }
}

