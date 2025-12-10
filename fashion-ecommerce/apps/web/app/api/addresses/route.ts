import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

// GET /api/addresses - Get user's addresses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }
    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch addresses',
      },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }
    const body = await request.json();
    const addressSchema = z.object({
      fullName: z.string().min(1, 'Full name is required'),
      phone: z.string().min(10, 'Phone number must be at least 10 digits'),
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State/Province is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required'),
      isDefault: z.boolean().optional().default(false),
    });

    const addressData = addressSchema.parse(body);

    // If this is set as default, unset all other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: address,
      message: 'Address created successfully',
    }, { status: 201 });
  } catch (error) {
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

    console.error('Error creating address:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create address',
      },
      { status: 500 }
    );
  }
}

