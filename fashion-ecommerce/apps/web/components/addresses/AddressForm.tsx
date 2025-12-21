'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/useToast';
import { authenticatedFetch } from '@/lib/utils';

interface Address {
  id?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface AddressFormProps {
  address?: Address | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Vietnam',
    isDefault: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault || false,
      });
    }
  }, [address]);

  // Load provinces list from API
  useEffect(() => {
    async function loadProvinces() {
      try {
        const res = await fetch('/api/locations/vietnam');
        if (!res.ok) return;
        const json = await res.json();
        const list = (json?.data as { name: string }[] | undefined)?.map((p) => p.name) ?? [];
        setProvinces(list);

        // Nếu chưa có state nhưng có danh sách tỉnh, set mặc định
        if (!address && list.length > 0) {
          setFormData((prev) => ({
            ...prev,
            state: prev.state || list[0],
          }));
        }
      } catch (e) {
        console.error('Failed to load provinces', e);
      }
    }

    loadProvinces();
  }, [address]);

  const validatePhone = (value: string): string | null => {
    if (!value) return 'Số điện thoại là bắt buộc';
    const regex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!regex.test(value)) {
      return 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09)';
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Validate realtime cho field phone
    if (name === 'phone') {
      setPhoneError(validatePhone(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number trước khi gọi API (và show lỗi ngay dưới field)
    const phoneValidation = validatePhone(formData.phone);
    setPhoneError(phoneValidation);
    if (phoneValidation) {
      // Optional: thêm toast để nhấn mạnh
      toastError('Lỗi', phoneValidation);
      return;
    }
    setLoading(true);

    try {
      const url = address?.id ? `/api/addresses/${address.id}` : '/api/addresses';
      const method = address?.id ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }

      toastSuccess(
        'Thành công',
        address?.id ? 'Địa chỉ đã được cập nhật' : 'Địa chỉ đã được thêm'
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toastError(
        'Lỗi',
        error.message || 'Có lỗi xảy ra khi lưu địa chỉ'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Họ và tên *</Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          placeholder="Nhập họ và tên"
        />
      </div>

      <div>
        <Label htmlFor="phone">Số điện thoại *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="Nhập số điện thoại"
          className={phoneError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        />
        {phoneError && (
          <p className="mt-1 text-sm text-red-500">{phoneError}</p>
        )}
      </div>

      <div>
        <Label htmlFor="street">Địa chỉ *</Label>
        <Input
          id="street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          required
          placeholder="Số nhà, tên đường"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Quận/Huyện</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="Quận/Huyện"
          />
        </div>
        <div>
          <Label htmlFor="state">Tỉnh/Thành phố *</Label>
          {provinces.length > 0 ? (
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Chọn Tỉnh</option>
              {provinces.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              placeholder="Tỉnh/Thành phố"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Mã bưu điện *</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
            placeholder="Mã bưu điện"
          />
        </div>
        <div>
          <Label htmlFor="country">Quốc gia *</Label>
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            placeholder="Quốc gia"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          checked={formData.isDefault}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <Label htmlFor="isDefault" className="ml-2">
          Đặt làm địa chỉ mặc định
        </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Đang lưu...' : address?.id ? 'Cập nhật' : 'Thêm địa chỉ'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}

