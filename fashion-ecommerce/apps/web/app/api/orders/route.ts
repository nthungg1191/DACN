import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { cache } from '@/lib/redis';
import { calculateShippingFee, calculateTax, getSettings } from '@/lib/settings';

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
      couponId: z.string().optional(),
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

    const { shippingAddressId, billingAddressId, paymentMethod, notes, couponId } = parsedData;

    // Validate payment method is enabled
    const settings = await getSettings();
    const isPaymentMethodEnabled = 
      (paymentMethod === 'COD' && settings.paymentCodEnabled) ||
      (paymentMethod === 'BANK_TRANSFER' && settings.paymentBankTransferEnabled) ||
      (paymentMethod === 'CREDIT_CARD' && settings.paymentCreditCardEnabled);

    if (!isPaymentMethodEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phương thức thanh toán này hiện không khả dụng',
        },
        { status: 400 }
      );
    }

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

    // Validate cart items stock (check both product and variant stock)
    for (const item of cart.items) {
      // Check product total stock
      if (item.product.quantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${item.product.name}. Only ${item.product.quantity} available.`,
          },
          { status: 400 }
        );
      }

      // If item has size and color, also check variant stock
      if (item.size && item.color) {
        const variant = await prisma.productVariant.findFirst({
          where: {
            productId: item.productId,
            size: item.size,
            color: item.color,
          },
        });

        if (variant && variant.quantity < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for ${item.product.name} - ${item.size} ${item.color}. Only ${variant.quantity} available.`,
            },
            { status: 400 }
          );
        }
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
    const orderItems = cart.items.map((item) => {
      // Use variant price from CartItem if available, otherwise use product price
      const itemPrice = item.price ? Number(item.price) : Number(item.product.price);
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        total: itemTotal,
      };
    });

    // Validate and apply coupon if provided
    let discount = 0;
    let coupon = null;
    if (couponId) {
      coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã giảm giá không tồn tại',
          },
          { status: 400 }
        );
      }

      // Validate coupon
      const now = new Date();
      if (!coupon.active) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã giảm giá đã bị vô hiệu hóa',
          },
          { status: 400 }
        );
      }

      if (now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã giảm giá không còn hiệu lực',
          },
          { status: 400 }
        );
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã giảm giá đã hết lượt sử dụng',
          },
          { status: 400 }
        );
      }

      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        return NextResponse.json(
          {
            success: false,
            error: `Đơn hàng tối thiểu ${Number(coupon.minOrderAmount).toLocaleString('vi-VN')}đ để sử dụng mã này`,
          },
          { status: 400 }
        );
      }

      // Calculate discount
      if (coupon.type === 'PERCENTAGE') {
        discount = subtotal * (Number(coupon.value) / 100);
        if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
          discount = Number(coupon.maxDiscountAmount);
        }
      } else if (coupon.type === 'FIXED') {
        discount = Number(coupon.value);
        if (discount > subtotal) {
          discount = subtotal;
        }
      }
    }

    const subtotalAfterDiscount = Math.max(0, subtotal - discount);
    const shipping = await calculateShippingFee(subtotalAfterDiscount);
    const tax = await calculateTax(subtotalAfterDiscount);
    const total = subtotalAfterDiscount + shipping + tax;

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

      // Update coupon usedCount if coupon is applied
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal,
          discount: Math.round(discount),
          tax,
          shipping,
          total,
          couponId: coupon?.id || null,
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

      // Update product and variant quantities
      for (const item of cart.items) {
        // If item has size and color, find and update the variant
        if (item.size && item.color) {
          const variant = await tx.productVariant.findFirst({
            where: {
              productId: item.productId,
              size: item.size,
              color: item.color,
            },
          });

          if (variant) {
            // Check variant stock
            if (variant.quantity < item.quantity) {
              throw new Error(`Insufficient stock for variant ${item.size} ${item.color}. Only ${variant.quantity} available.`);
            }

            // Update variant quantity
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // Always update product total quantity
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

