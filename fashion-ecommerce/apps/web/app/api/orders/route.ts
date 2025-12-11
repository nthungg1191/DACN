import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { cache } from '@/lib/redis';

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Check cache (giảm thời gian cache để dữ liệu mới hơn)
    const cacheKey = `orders:user:${user.id}:page:${page}:limit:${limit}`;
    const cached = await cache.get<{ data: unknown; pagination: unknown }>(cacheKey);
    
    if (cached) {
      // Đảm bảo cached data có đúng format
      const cachedData = cached.data || [];
      const cachedPagination = cached.pagination || {};
      
      // Validate cached data format
      if (!Array.isArray(cachedData)) {
        await cache.del(cacheKey);
        // Fall through to fetch fresh data
      } else {
        return NextResponse.json({
          success: true,
          data: cachedData,
          pagination: cachedPagination,
        });
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
                  images: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    console.log('[Orders API] Database query result - orders count:', orders.length, 'total:', total);

    const result = {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Chỉ cache nếu có orders hoặc total > 0
    // Tránh cache empty result (có thể do orders bị xóa sau khi cache)
    if (orders.length > 0 || total > 0) {
      // Cache for 30 seconds (giảm từ 2 phút) để dữ liệu mới hơn
      // Orders có thể thay đổi nhanh (hủy, thanh toán) nên cache ngắn hơn
      // ⚠️ QUAN TRỌNG: cache.set() đã tự động JSON.stringify rồi, không cần stringify thủ công
      await cache.set(cacheKey, result, 30);
    } else {
      // Xóa cache cũ nếu có (tránh trả về empty cache)
      await cache.del(cacheKey);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Orders API] Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    console.log('Order request body:', JSON.stringify(body, null, 2));
    
    const orderSchema = z.object({
      shippingAddressId: z.string().min(1, 'Shipping address is required'),
      billingAddressId: z.string().optional(),
      paymentMethod: z.string().min(1, 'Payment method is required'),
      notes: z.string().optional(),
    });

    let parsedData;
    try {
      parsedData = orderSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { shippingAddressId, billingAddressId, paymentMethod, notes } = parsedData;

    // Get user's cart
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
                price: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    console.log('Cart status:', { 
      cartExists: !!cart, 
      itemsCount: cart?.items.length || 0,
      userId: user.id 
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart is empty',
        },
        { status: 400 }
      );
    }

    // Validate cart items stock
    for (const item of cart.items) {
      if (item.product.quantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${item.product.name}. Only ${item.product.quantity} available.`,
          },
          { status: 400 }
        );
      }
    }

    // Get addresses
    console.log('Looking for shipping address:', { shippingAddressId, userId: user.id });
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId: user.id,
      },
    });

    console.log('Shipping address found:', !!shippingAddress);

    if (!shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shipping address not found',
          details: `Address ID ${shippingAddressId} not found for user ${user.id}`,
        },
        { status: 400 }
      );
    }

    const billingAddress = billingAddressId
      ? await prisma.address.findFirst({
          where: {
            id: billingAddressId,
            userId: user.id,
          },
        })
      : shippingAddress;

    if (!billingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Billing address not found',
          details: billingAddressId 
            ? `Address ID ${billingAddressId} not found for user ${user.id}`
            : 'Billing address is required',
        },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cart.items.map((item: any) => {
      const itemPrice = Number(item.product.price);
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        total: itemTotal,
      };
    });

    const shipping = 0; // Free shipping for now
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Prepare address data for JSON fields
      const shippingAddressData = {
        id: shippingAddress.id,
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      };

      const billingAddressData = {
        id: billingAddress.id,
        fullName: billingAddress.fullName,
        phone: billingAddress.phone,
        street: billingAddress.street,
        city: billingAddress.city,
        state: billingAddress.state,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
      };

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal,
          tax,
          shipping,
          total,
          shippingAddress: shippingAddressData,
          billingAddress: billingAddressData,
          paymentMethod,
          paymentStatus: 'PENDING',
          notes: notes || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      // Update product quantities
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      // Invalidate cache
      await cache.delPattern(`orders:user:${user.id}:*`);
      await cache.del(`cart:user:${user.id}`);

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

