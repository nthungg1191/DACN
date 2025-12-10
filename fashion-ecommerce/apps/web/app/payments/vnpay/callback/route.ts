/**
 * Route Handler: GET /payments/vnpay/callback
 * 
 * Xử lý callback từ VNPay sau khi thanh toán
 * Route này được VNPay gọi trực tiếp (không qua /api prefix)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVNPayClient } from '@/lib/payments/vnpay/client';
import { prisma } from '@repo/database';

/**
 * Helper function để tạo redirect URL an toàn
 * Xử lý trường hợp HTTPS localhost (không có SSL) và ngrok URL
 */
function getRedirectUrl(path: string, request: NextRequest): URL {
  const requestUrl = new URL(request.url);
  
  // Nếu request đến từ HTTPS localhost (không có SSL), chuyển về HTTP
  if (requestUrl.hostname === 'localhost' && requestUrl.protocol === 'https:') {
    // Tạo base URL với HTTP thay vì HTTPS
    const baseUrl = `http://${requestUrl.hostname}${requestUrl.port ? `:${requestUrl.port}` : ''}`;
    return new URL(path, baseUrl);
  }
  
  // Tạo URL mới với path đã cho (giữ nguyên protocol và host)
  return new URL(path, requestUrl.origin);
}

export async function GET(request: NextRequest) {
  try {
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== VNPay Callback Debug ===');
      console.log('Request URL:', request.url);
      console.log('Request URL pathname:', request.nextUrl.pathname);
      console.log('Request URL search:', request.nextUrl.search);
    }

    const searchParams = request.nextUrl.searchParams;

    // Lấy tất cả params từ VNPay
    const callbackParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Callback Params:', JSON.stringify(callbackParams, null, 2));
      console.log('Params count:', Object.keys(callbackParams).length);
    }

    // Kiểm tra có vnp_ResponseCode không
    if (!callbackParams.vnp_ResponseCode) {
      return NextResponse.redirect(
        getRedirectUrl('/payment/failed?error=invalid_response', request)
      );
    }

    // Tạo VNPay client
    const vnpayClient = createVNPayClient();

    // Xác thực callback
    const isValid = vnpayClient.verifyCallback(
      callbackParams as any
    );

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Verification result:', isValid);
      console.log('vnp_SecureHash from callback:', callbackParams.vnp_SecureHash);
    }

    if (!isValid) {
      console.error('VNPay callback verification failed:', callbackParams);
      return NextResponse.redirect(
        getRedirectUrl('/payment/failed?error=verification_failed', request)
      );
    }

    // Lấy order number từ vnp_TxnRef
    const orderNumber = callbackParams.vnp_TxnRef;
    const responseCode = callbackParams.vnp_ResponseCode;
    const transactionNo = callbackParams.vnp_TransactionNo;
    const transactionStatus = callbackParams.vnp_TransactionStatus;

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
    if (responseCode === '00' && transactionStatus === '00') {
      // Thanh toán thành công
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentTransactionId: transactionNo,
          paymentMetadata: {
            vnp_ResponseCode: responseCode,
            vnp_TransactionNo: transactionNo,
            vnp_BankCode: callbackParams.vnp_BankCode,
            vnp_CardType: callbackParams.vnp_CardType,
            vnp_PayDate: callbackParams.vnp_PayDate,
            vnp_BankTranNo: callbackParams.vnp_BankTranNo,
          },
        },
      });

      // Redirect đến trang thành công
      return NextResponse.redirect(
        getRedirectUrl(`/orders/${order.id}?payment=success`, request)
      );
    } else {
      // Thanh toán thất bại
      const errorMessage = vnpayClient.getResponseMessage(responseCode);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          paymentMetadata: {
            vnp_ResponseCode: responseCode,
            vnp_TransactionNo: transactionNo,
            errorMessage: errorMessage,
          },
        },
      });

      // Redirect đến trang thất bại
      return NextResponse.redirect(
        getRedirectUrl(`/payment/failed?orderId=${order.id}&error=${responseCode}`, request)
      );
    }
  } catch (error) {
    console.error('Error processing VNPay callback:', error);
    return NextResponse.redirect(
      getRedirectUrl('/payment/failed?error=internal_error', request)
    );
  }
}

