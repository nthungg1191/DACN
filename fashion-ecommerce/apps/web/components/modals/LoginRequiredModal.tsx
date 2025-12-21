'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import { Lock } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  callbackUrl?: string;
  forceLogin?: boolean; // Nếu true, không cho phép đóng modal bằng cách click overlay hoặc nút hủy
}

export function LoginRequiredModal({
  isOpen,
  onClose,
  message = 'Bạn cần đăng nhập để tiếp tục',
  callbackUrl = '/',
  forceLogin = false,
}: LoginRequiredModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    const url = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    router.push(url);
    onClose();
  };

  const handleClose = () => {
    if (!forceLogin) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnOverlayClick={!forceLogin}
      showCloseButton={!forceLogin}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <Lock className="h-8 w-8 text-yellow-600" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Yêu cầu đăng nhập
        </h3>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục sử dụng dịch vụ.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Đăng nhập
          </Button>
          <Link href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
            >
              Đăng ký
            </Button>
          </Link>
        </div>

        {/* Cancel button - chỉ hiển thị nếu không force login */}
        {!forceLogin && (
          <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Hủy
          </button>
        )}
      </div>
    </Modal>
  );
}

