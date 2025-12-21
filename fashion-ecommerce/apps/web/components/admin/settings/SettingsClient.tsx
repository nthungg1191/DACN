'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/useToast';
import { Save, Loader2 } from 'lucide-react';

interface Settings {
  id: string;
  storeName: string | null;
  storeLogo: string | null;
  storeEmail: string | null;
  storePhone: string | null;
  storeAddress: string | null;
  storeDescription: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  paymentCodEnabled: boolean;
  paymentBankTransferEnabled: boolean;
  paymentCreditCardEnabled: boolean;
  shippingFee: number;
  freeShippingThreshold: number | null;
  taxRate: number;
  orderExpiryMinutes: number;
  currency: string;
  timezone: string;
  language: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  favicon: string | null;
}

type Tab = 'store' | 'payment' | 'shipping' | 'tax' | 'orders' | 'seo';

export function SettingsClient() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('store');
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        error('Lỗi', 'Không thể tải cài đặt');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      error('Lỗi', 'Đã xảy ra lỗi khi tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        success('Thành công', 'Đã lưu cài đặt thành công');
        setSettings(data.data);
      } else {
        error('Lỗi', data.error || 'Không thể lưu cài đặt');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      error('Lỗi', 'Đã xảy ra lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Không thể tải cài đặt</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'store', label: 'Thông tin cửa hàng' },
    { id: 'payment', label: 'Thanh toán' },
    { id: 'shipping', label: 'Vận chuyển' },
    { id: 'tax', label: 'Thuế' },
    { id: 'orders', label: 'Đơn hàng' },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Thông tin cửa hàng */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="storeName">Tên cửa hàng</Label>
                <Input
                  id="storeName"
                  value={settings.storeName || ''}
                  onChange={(e) => updateSetting('storeName', e.target.value)}
                  placeholder="Fashion Store"
                />
              </div>

              <div>
                <Label htmlFor="storeLogo">Logo URL</Label>
                <Input
                  id="storeLogo"
                  value={settings.storeLogo || ''}
                  onChange={(e) => updateSetting('storeLogo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storeEmail">Email</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={settings.storeEmail || ''}
                    onChange={(e) => updateSetting('storeEmail', e.target.value)}
                    placeholder="contact@store.com"
                  />
                </div>
                <div>
                  <Label htmlFor="storePhone">Số điện thoại</Label>
                  <Input
                    id="storePhone"
                    value={settings.storePhone || ''}
                    onChange={(e) => updateSetting('storePhone', e.target.value)}
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="storeAddress">Địa chỉ</Label>
                <Textarea
                  id="storeAddress"
                  value={settings.storeAddress || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSetting('storeAddress', e.target.value)}
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="storeDescription">Mô tả</Label>
                <Textarea
                  id="storeDescription"
                  value={settings.storeDescription || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSetting('storeDescription', e.target.value)}
                  placeholder="Mô tả về cửa hàng..."
                  rows={4}
                />
              </div>

              <div>
                <Label className="mb-3 block">Mạng xã hội</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="facebookUrl" className="text-sm text-gray-600">Facebook</Label>
                    <Input
                      id="facebookUrl"
                      type="url"
                      value={settings.facebookUrl || ''}
                      onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagramUrl" className="text-sm text-gray-600">Instagram</Label>
                    <Input
                      id="instagramUrl"
                      type="url"
                      value={settings.instagramUrl || ''}
                      onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tiktokUrl" className="text-sm text-gray-600">TikTok</Label>
                    <Input
                      id="tiktokUrl"
                      type="url"
                      value={settings.tiktokUrl || ''}
                      onChange={(e) => updateSetting('tiktokUrl', e.target.value)}
                      placeholder="https://tiktok.com/@yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtubeUrl" className="text-sm text-gray-600">YouTube</Label>
                    <Input
                      id="youtubeUrl"
                      type="url"
                      value={settings.youtubeUrl || ''}
                      onChange={(e) => updateSetting('youtubeUrl', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Thanh toán */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Phương thức thanh toán</Label>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentCodEnabled}
                      onChange={(e) => updateSetting('paymentCodEnabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentBankTransferEnabled}
                      onChange={(e) => updateSetting('paymentBankTransferEnabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Chuyển khoản ngân hàng</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentCreditCardEnabled}
                      onChange={(e) => updateSetting('paymentCreditCardEnabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Thẻ tín dụng</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Vận chuyển */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="shippingFee">Phí vận chuyển (₫)</Label>
                <Input
                  id="shippingFee"
                  type="number"
                  min="0"
                  value={settings.shippingFee}
                  onChange={(e) => updateSetting('shippingFee', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500 mt-1">Đặt 0 để miễn phí vận chuyển</p>
              </div>

              <div>
                <Label htmlFor="freeShippingThreshold">Đơn tối thiểu để miễn phí ship (₫)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  min="0"
                  value={settings.freeShippingThreshold || ''}
                  onChange={(e) => updateSetting('freeShippingThreshold', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Không giới hạn"
                />
                <p className="text-sm text-gray-500 mt-1">Để trống nếu không áp dụng</p>
              </div>
            </div>
          )}

          {/* Tab: Thuế */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="taxRate">Thuế VAT (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500 mt-1">Ví dụ: 10 cho 10%</p>
              </div>
            </div>
          )}

          {/* Tab: Đơn hàng */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="orderExpiryMinutes">Thời gian hết hạn đơn hàng (phút)</Label>
                <Input
                  id="orderExpiryMinutes"
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.orderExpiryMinutes}
                  onChange={(e) => updateSetting('orderExpiryMinutes', parseInt(e.target.value) || 10)}
                />
                <p className="text-sm text-gray-500 mt-1">Thời gian đơn hàng chưa thanh toán sẽ tự động bị hủy (tối đa 1440 phút = 24 giờ)</p>
              </div>
            </div>
          )}

          {/* Tab: SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.metaTitle || ''}
                  onChange={(e) => updateSetting('metaTitle', e.target.value)}
                  placeholder="Fashion Store - Thời trang cao cấp"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.metaDescription || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSetting('metaDescription', e.target.value)}
                  placeholder="Mô tả ngắn về cửa hàng..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={settings.metaKeywords || ''}
                  onChange={(e) => updateSetting('metaKeywords', e.target.value)}
                  placeholder="thời trang, quần áo, phụ kiện"
                />
                <p className="text-sm text-gray-500 mt-1">Phân cách bằng dấu phẩy</p>
              </div>

              <div>
                <Label htmlFor="ogImage">Open Graph Image URL</Label>
                <Input
                  id="ogImage"
                  type="url"
                  value={settings.ogImage || ''}
                  onChange={(e) => updateSetting('ogImage', e.target.value)}
                  placeholder="https://example.com/og-image.png"
                />
              </div>

              <div>
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  type="url"
                  value={settings.favicon || ''}
                  onChange={(e) => updateSetting('favicon', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Lưu cài đặt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

