/**
 * API Route: POST /api/payments/vnpay/create
 * 
 * Tạo payment URL với VNPay
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { createVNPayClient, VNPayClient } from '@/lib/payments/vnpay/client';
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

    // Tạo VNPay client
    const vnpayClient = createVNPayClient();

    // Lấy IP address từ request
    const ipAddr = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';

    // Tạo payment URL
    const paymentUrl = vnpayClient.createPaymentUrl({
      orderId: order.orderNumber,
      amount: Number(order.total),
      orderDescription: `Thanh toan don hang ${order.orderNumber}`,
      orderType: 'other',
      locale: 'vn',
      ipAddr: ipAddr.split(',')[0].trim(),
    });

    // Cập nhật order với payment gateway và URL
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentGateway: 'VNPay',
        paymentUrl: paymentUrl,
        paymentStatus: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl,
        orderId: order.orderNumber,
      },
    });
  } catch (error) {
    console.error('Error creating VNPay payment:', error);

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
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

