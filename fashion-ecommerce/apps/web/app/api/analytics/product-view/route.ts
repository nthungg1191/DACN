import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = body.productId as string | undefined;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      );
    }

    // Try to get current user (optional)
    const user = await getCurrentUser();

    // Fire-and-forget style logging, but await once to avoid unhandled rejection
    await prisma.productView.create({
      data: {
        productId,
        userId: user?.id ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging product view:', error);
    // Do not break user experience because of analytics
    return NextResponse.json({ success: true });
  }
}


