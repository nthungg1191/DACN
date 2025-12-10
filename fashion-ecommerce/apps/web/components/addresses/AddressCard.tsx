'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/useToast';
import { useAddresses } from '@/hooks/useSWR';
import { authenticatedFetch } from '@/lib/utils';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onSelect?: (address: Address) => void;
  showActions?: boolean;
  showSelect?: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onSelect,
  showActions = true,
  showSelect = false,
}: AddressCardProps) {
  const { toast } = useToast();
  const { mutate } = useAddresses();

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/addresses/${address.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Xóa địa chỉ thất bại');
      }

      toast({
        title: 'Thành công',
        description: 'Địa chỉ đã được xóa',
        type: 'success',
      });

      mutate();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi xóa địa chỉ',
        type: 'error',
      });
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 ${
        address.isDefault ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{address.fullName}</h3>
            {address.isDefault && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                Mặc định
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{address.street}</p>
            <p>
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p>{address.country}</p>
            <p className="mt-2">Điện thoại: {address.phone}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {showSelect && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onSelect?.(address)}
            className="flex-1"
          >
            Chọn địa chỉ này
          </Button>
        )}
        {showActions && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(address)}
              className="flex-1"
            >
              Chỉnh sửa
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              Xóa
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

