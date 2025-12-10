import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

const querySchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// GET /api/wishlist/check?productId=xxx - Check if product is in wishlist
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const { productId } = querySchema.parse(Object.fromEntries(searchParams));

    // Check if product exists in user's wishlist
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId: user.id,
        productId: productId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isInWishlist: !!wishlistItem,
        wishlistItemId: wishlistItem?.id || null,
        addedAt: wishlistItem?.createdAt || null,
      },
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check wishlist',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
