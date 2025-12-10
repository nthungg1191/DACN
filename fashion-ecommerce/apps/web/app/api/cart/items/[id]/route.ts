import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().min(1, 'Cart item ID is required'),
});

// PUT /api/cart/items/[id] - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { id } = paramsSchema.parse(params);
    const body = await request.json();
    const updateSchema = z.object({
      quantity: z.number().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
    });

    const { quantity } = updateSchema.parse(body);

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: id,
        cart: {
          userId: user.id,
        },
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart item not found',
        },
        { status: 404 }
      );
    }

    // Check if product has enough stock
    if (cartItem.product.quantity < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient stock',
          message: `Only ${cartItem.product.quantity} items available`,
        },
        { status: 400 }
      );
    }

    // Update cart item quantity
    const updatedItem = await prisma.cartItem.update({
      where: {
        id: id,
      },
      data: {
        quantity: quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            quantity: true,
            published: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Cart item updated',
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update cart item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/items/[id] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { id } = paramsSchema.parse(params);

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: id,
        cart: {
          userId: user.id,
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart item not found',
        },
        { status: 404 }
      );
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove cart item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
