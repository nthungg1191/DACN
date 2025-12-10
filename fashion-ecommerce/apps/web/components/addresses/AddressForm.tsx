'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/useToast';

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = address?.id ? `/api/addresses/${address.id}` : '/api/addresses';
      const method = address?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
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

      toast({
        title: 'Thành công',
        description: address?.id ? 'Địa chỉ đã được cập nhật' : 'Địa chỉ đã được thêm',
        type: 'success',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi lưu địa chỉ',
        type: 'error',
      });
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
        />
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
          <Label htmlFor="city">Thành phố *</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="Thành phố"
          />
        </div>
        <div>
          <Label htmlFor="state">Tỉnh/Thành phố *</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            placeholder="Tỉnh/Thành phố"
          />
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

