import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { Prisma } from '@prisma/client';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        items: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cart) {
      // Create empty cart if it doesn't exist
      const newCart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
        include: {
          items: {
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
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          cart: newCart,
          totalItems: 0,
          subtotal: 0,
        },
      });
    }

    // Calculate totals
    const totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      const itemPrice = item.price ? Number(item.price) : Number(item.product.price);
      return sum + (itemPrice * item.quantity);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        cart,
        totalItems,
        subtotal: Number(subtotal.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear user's cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createUnauthorizedResponse();
    }

    // Find cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
        message: 'Cart already empty',
      });
    }

    // Delete all items in the cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const addItemSchema = z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
      size: z.string().optional(),
      color: z.string().optional(),
      price: z.number().optional(),
    });

    const { productId, quantity, size, color, price } = addItemSchema.parse(body);

    // Check if product exists and is published
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        published: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found or not available',
        },
        { status: 404 }
      );
    }

    // Check if product has enough stock
    if (product.quantity < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient stock',
          message: `Only ${product.quantity} items available`,
        },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        size: size || null,
        color: color || null,
      },
    });

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.quantity < newQuantity) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient stock',
            message: `Only ${product.quantity} items available`,
          },
          { status: 400 }
        );
      }

      const updatedItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
          size: size || null,
          color: color || null,
          price: price ? new Prisma.Decimal(price) : existingItem.price,
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
        message: 'Item quantity updated in cart',
      });
    } else {
      // Add new item to cart
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
          size: size || null,
          color: color || null,
          price: price ? new Prisma.Decimal(price) : null,
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
        data: newItem,
        message: 'Item added to cart',
      });
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add item to cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
