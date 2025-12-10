/**
 * API Route: POST /api/payments/sepay/create
 * 
 * Tạo payment form fields với SePay
 * SePay sử dụng form-based payment (submit form với POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { createSePayClient } from '@/lib/payments/sepay/client';
import { prisma } from '@repo/database';
import { z } from 'zod';

const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Xác thực user
    const user = await getCurrentUser();

    if (!user) {
      return createUnauthorizedResponse();
    }

    // Parse request body
    const body = await request.json();
    const { orderId } = createPaymentSchema.parse(body);

    // Lấy order từ database
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: user.id, // Đảm bảo order thuộc về user
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            id: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Kiểm tra order status
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Order already paid' },
        { status: 400 }
      );
    }

    // Tạo SePay client
    const sepayClient = createSePayClient();

    // Xử lý base callback URL:
    // - Nếu SEPAY_RETURN_URL đã là full URL (ví dụ: https://xxx.ngrok-free.app/api/payments/sepay/callback)
    //   thì dùng nguyên URL đó và chỉ thêm query ?status=...
    // - Nếu không có, tự build từ origin
    const envReturnUrl = process.env.SEPAY_RETURN_URL;
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    let baseCallbackUrl: string;
    if (envReturnUrl) {
      // Bỏ query string nếu có, giữ nguyên path
      const url = new URL(envReturnUrl);
      url.search = '';
      baseCallbackUrl = url.toString().replace(/\/$/, ''); // bỏ dấu / cuối nếu có
    } else {
      baseCallbackUrl = `${origin.replace(/\/$/, '')}/api/payments/sepay/callback`;
    }

    // Tạo callback URLs kèm orderNumber để phía server tra cứu được đơn hàng
    const orderNumber = order.orderNumber;
    const baseQuery = `orderNumber=${encodeURIComponent(orderNumber)}`;

    const successUrl = `${baseCallbackUrl}?${baseQuery}&status=success`;
    const errorUrl = `${baseCallbackUrl}?${baseQuery}&status=error`;
    const cancelUrl = `${baseCallbackUrl}?${baseQuery}&status=cancel`;

    // Tạo payment form fields
    const { checkoutUrl, formFields } = sepayClient.createPaymentFormFields({
      orderId: order.orderNumber,
      amount: Number(order.total),
      orderDescription: `Thanh toan don hang ${order.orderNumber}`,
      customerId: user.id,
      paymentMethod: 'BANK_TRANSFER', // BANK_TRANSFER cho chuyển khoản ngân hàng
      successUrl,
      errorUrl,
      cancelUrl,
      customData: JSON.stringify({ orderId: order.id }),
    });

    // Cập nhật order với payment gateway và form data
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentGateway: 'SePay',
        paymentUrl: checkoutUrl, // Lưu checkout URL
        paymentStatus: 'PENDING',
        paymentMetadata: {
          checkoutUrl,
          formFields, // Lưu form fields để có thể verify sau
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
        formFields,
        orderId: order.orderNumber,
      },
    });
  } catch (error) {
    console.error('Error creating SePay payment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
