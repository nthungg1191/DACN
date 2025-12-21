import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

// GET /api/settings - Get public settings (no auth required)
export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    
    // Chỉ trả về thông tin public, không trả về sensitive data
    return NextResponse.json({
      success: true,
      data: {
        storeName: settings.storeName,
        storeLogo: settings.storeLogo,
        storeEmail: settings.storeEmail,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress,
        storeDescription: settings.storeDescription,
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        tiktokUrl: settings.tiktokUrl,
        youtubeUrl: settings.youtubeUrl,
        paymentCodEnabled: settings.paymentCodEnabled,
        paymentBankTransferEnabled: settings.paymentBankTransferEnabled,
        paymentCreditCardEnabled: settings.paymentCreditCardEnabled,
        currency: settings.currency,
        // Trả về shippingFee và taxRate để frontend tính toán
        shippingFee: settings.shippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        taxRate: settings.taxRate,
      },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

