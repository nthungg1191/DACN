import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-server';
import { z } from 'zod';

// GET /api/addresses/[id] - Get address by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { id } = await context.params;

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch address',
      },
      { status: 500 }
    );
  }
}

// PUT /api/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Check if address exists and belongs to user
    const { id } = await context.params;

    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address not found',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const addressSchema = z.object({
      fullName: z.string().min(1, 'Full name is required').optional(),
      phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
      street: z.string().min(1, 'Street address is required').optional(),
      city: z.string().min(1, 'City is required').optional(),
      state: z.string().min(1, 'State/Province is required').optional(),
      postalCode: z.string().min(1, 'Postal code is required').optional(),
      country: z.string().min(1, 'Country is required').optional(),
      isDefault: z.boolean().optional(),
    });

    const addressData = addressSchema.parse(body);

    // If this is set as default, unset all other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.update({
      where: {
        id,
      },
      data: addressData,
    });

    return NextResponse.json({
      success: true,
      data: address,
      message: 'Address updated successfully',
    });
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

    console.error('Error updating address:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update address',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id] - Delete address
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Check if address exists and belongs to user
    const { id } = await context.params;

    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address not found',
        },
        { status: 404 }
      );
    }

    await prisma.address.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete address',
      },
      { status: 500 }
    );
  }
}

