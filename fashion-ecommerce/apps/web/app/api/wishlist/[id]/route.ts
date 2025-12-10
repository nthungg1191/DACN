import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().min(1, 'Wishlist item ID is required'),
});

// DELETE /api/wishlist/[id] - Remove item from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  const wishlistItemId = params.id;
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { id } = paramsSchema.parse(params);

    // Check if wishlist item exists and belongs to user
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!wishlistItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wishlist item not found',
        },
        { status: 404 }
      );
    }

    // Delete wishlist item
    await prisma.wishlist.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove wishlist item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
