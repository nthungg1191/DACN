import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin, createForbiddenResponse } from '@/lib/auth-server';
import { z } from 'zod';
import { invalidateSettingsCache } from '@/lib/settings';

// GET /api/admin/settings - Get settings
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    });

    // Nếu chưa có settings, tạo mặc định
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'settings',
        },
      });
    }

    // Serialize Decimal fields
    const serialized = {
      ...settings,
      shippingFee: typeof settings.shippingFee === 'object' && 'toNumber' in settings.shippingFee
        ? settings.shippingFee.toNumber()
        : Number(settings.shippingFee),
      freeShippingThreshold: settings.freeShippingThreshold
        ? (typeof settings.freeShippingThreshold === 'object' && 'toNumber' in settings.freeShippingThreshold
          ? settings.freeShippingThreshold.toNumber()
          : Number(settings.freeShippingThreshold))
        : null,
      taxRate: typeof settings.taxRate === 'object' && 'toNumber' in settings.taxRate
        ? settings.taxRate.toNumber()
        : Number(settings.taxRate),
    };

    return NextResponse.json({
      success: true,
      data: serialized,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settings - Update settings
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return createForbiddenResponse();
  }

  try {
    const body = await request.json();

    const updateSchema = z.object({
      // Thông tin cửa hàng
      storeName: z.string().optional(),
      storeLogo: z.string().optional().nullable(),
      storeEmail: z.string().email().optional().nullable(),
      storePhone: z.string().optional().nullable(),
      storeAddress: z.string().optional().nullable(),
      storeDescription: z.string().optional().nullable(),
      facebookUrl: z.string().url().optional().nullable(),
      instagramUrl: z.string().url().optional().nullable(),
      tiktokUrl: z.string().url().optional().nullable(),
      youtubeUrl: z.string().url().optional().nullable(),
      
      // Cấu hình thanh toán
      paymentCodEnabled: z.boolean().optional(),
      paymentBankTransferEnabled: z.boolean().optional(),
      paymentCreditCardEnabled: z.boolean().optional(),
      
      // Cấu hình vận chuyển
      shippingFee: z.number().min(0).optional(),
      freeShippingThreshold: z.number().min(0).optional().nullable(),
      
      // Cấu hình thuế
      taxRate: z.number().min(0).max(100).optional(),
      
      // Cấu hình đơn hàng
      orderExpiryMinutes: z.number().int().min(1).max(1440).optional(), // Tối đa 24 giờ
      
      // Cấu hình hệ thống
      currency: z.string().optional(),
      timezone: z.string().optional(),
      language: z.string().optional(),
      
      // SEO
      metaTitle: z.string().optional().nullable(),
      metaDescription: z.string().optional().nullable(),
      metaKeywords: z.string().optional().nullable(),
      ogImage: z.string().optional().nullable(),
      favicon: z.string().optional().nullable(),
    });

    const parsedData = updateSchema.parse(body);

    // Upsert settings
    const updated = await prisma.settings.upsert({
      where: { id: 'settings' },
      update: {
        ...parsedData,
        ...(parsedData.shippingFee !== undefined && { shippingFee: parsedData.shippingFee }),
        ...(parsedData.freeShippingThreshold !== undefined && { 
          freeShippingThreshold: parsedData.freeShippingThreshold !== null ? parsedData.freeShippingThreshold : null 
        }),
        ...(parsedData.taxRate !== undefined && { taxRate: parsedData.taxRate }),
      },
      create: {
        id: 'settings',
        ...parsedData,
        shippingFee: parsedData.shippingFee ?? 0,
        taxRate: parsedData.taxRate ?? 10,
        orderExpiryMinutes: parsedData.orderExpiryMinutes ?? 10,
      },
    });

    // Serialize Decimal fields
    const serialized = {
      ...updated,
      shippingFee: typeof updated.shippingFee === 'object' && 'toNumber' in updated.shippingFee
        ? updated.shippingFee.toNumber()
        : Number(updated.shippingFee),
      freeShippingThreshold: updated.freeShippingThreshold
        ? (typeof updated.freeShippingThreshold === 'object' && 'toNumber' in updated.freeShippingThreshold
          ? updated.freeShippingThreshold.toNumber()
          : Number(updated.freeShippingThreshold))
        : null,
      taxRate: typeof updated.taxRate === 'object' && 'toNumber' in updated.taxRate
        ? updated.taxRate.toNumber()
        : Number(updated.taxRate),
    };

    // Invalidate cache để các API khác lấy settings mới
    await invalidateSettingsCache();

    return NextResponse.json({
      success: true,
      data: serialized,
      message: 'Settings updated successfully',
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

    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings',
      },
      { status: 500 }
    );
  }
}

