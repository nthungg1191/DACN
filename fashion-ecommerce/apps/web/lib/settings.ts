/**
 * Settings Helper
 * Lấy và cache settings từ database
 */

import { prisma } from '@repo/database';
import { cache } from '@/lib/redis';

const SETTINGS_CACHE_TTL = 60 * 5; // 5 phút

export interface AppSettings {
  // Thông tin cửa hàng
  storeName: string;
  storeLogo: string | null;
  storeEmail: string | null;
  storePhone: string | null;
  storeAddress: string | null;
  storeDescription: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  
  // Cấu hình thanh toán
  paymentCodEnabled: boolean;
  paymentBankTransferEnabled: boolean;
  paymentCreditCardEnabled: boolean;
  
  // Cấu hình vận chuyển
  shippingFee: number;
  freeShippingThreshold: number | null;
  
  // Cấu hình thuế
  taxRate: number; // %
  
  // Cấu hình đơn hàng
  orderExpiryMinutes: number;
  
  // Cấu hình hệ thống
  currency: string;
  timezone: string;
  language: string;
  
  // SEO
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  favicon: string | null;
}

/**
 * Lấy settings từ DB (có cache)
 */
export async function getSettings(): Promise<AppSettings> {
  const cacheKey = 'app:settings';
  
  // Check cache
  const cached = await cache.get<AppSettings>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get from DB
  let settings = await prisma.settings.findUnique({
    where: { id: 'settings' },
  });

  // Nếu chưa có, tạo mặc định
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: 'settings',
      },
    });
  }

  // Serialize Decimal fields
  const serialized: AppSettings = {
    storeName: settings.storeName || 'Fashion Store',
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
    orderExpiryMinutes: settings.orderExpiryMinutes,
    currency: settings.currency,
    timezone: settings.timezone,
    language: settings.language,
    metaTitle: settings.metaTitle,
    metaDescription: settings.metaDescription,
    metaKeywords: settings.metaKeywords,
    ogImage: settings.ogImage,
    favicon: settings.favicon,
  };

  // Cache
  await cache.set(cacheKey, serialized, SETTINGS_CACHE_TTL);

  return serialized;
}

/**
 * Tính shipping fee dựa trên settings
 */
export async function calculateShippingFee(subtotal: number): Promise<number> {
  const settings = await getSettings();
  
  // Nếu có freeShippingThreshold và subtotal >= threshold thì miễn phí
  if (settings.freeShippingThreshold && subtotal >= settings.freeShippingThreshold) {
    return 0;
  }
  
  return settings.shippingFee;
}

/**
 * Tính tax dựa trên settings
 */
export async function calculateTax(subtotal: number): Promise<number> {
  const settings = await getSettings();
  return subtotal * (settings.taxRate / 100);
}

/**
 * Invalidate settings cache (gọi khi settings được update)
 */
export async function invalidateSettingsCache(): Promise<void> {
  await cache.del('app:settings');
}

