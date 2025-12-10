'use client';

import React, { useState, useEffect } from 'react';
import { useAddresses } from '@/hooks/useSWR';
import { AddressForm } from '@/components/addresses/AddressForm';
import { AddressCard } from '@/components/addresses/AddressCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modals/Modal';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addresses, isLoading, mutate } = useAddresses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Redirect if not authenticated (only after session has loaded)
  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      router.push('/auth/signin?callbackUrl=/addresses');
    }
  }, [status, router]);

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
    mutate();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  // Show loading while session or addresses are loading
  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Địa chỉ của tôi</h1>
            <p className="text-gray-600">Quản lý địa chỉ giao hàng và thanh toán</p>
          </div>
          <Button onClick={handleAddNew}>Thêm địa chỉ mới</Button>
        </div>

        {/* Addresses List */}
        {addresses && addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEdit}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có địa chỉ nào
            </h3>
            <p className="text-gray-600 mb-6">
              Thêm địa chỉ đầu tiên để bắt đầu mua sắm
            </p>
            <Button onClick={handleAddNew}>Thêm địa chỉ mới</Button>
          </div>
        )}

        {/* Address Form Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={handleCancel}
          title={editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          size="lg"
        >
          <AddressForm
            address={editingAddress}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        </Modal>
      </div>
    </div>
  );
}

