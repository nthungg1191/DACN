'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  invalid_response: 'Phản hồi từ cổng thanh toán không hợp lệ',
  verification_failed: 'Xác thực thanh toán thất bại',
  order_not_found: 'Không tìm thấy đơn hàng',
  internal_error: 'Có lỗi xảy ra trong quá trình xử lý thanh toán',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng. Vui lòng thử lại',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thử lại',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Nhập sai mật khẩu xác thực (OTP). Vui lòng thử lại',
  '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch cho phép',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Lỗi không xác định',
};

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const orderId = searchParams?.get('orderId');
  const errorCode = searchParams?.get('error') || 'unknown';
  const errorMessage = errorMessages[errorCode] || 'Thanh toán không thành công. Vui lòng thử lại sau.';

  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      router.push('/auth/signin?callbackUrl=/payment/failed');
    }
  }, [status, router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thanh toán không thành công
          </h1>

          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <p className="text-red-800 font-medium mb-1">Lỗi thanh toán</p>
                <p className="text-red-700 text-sm">{errorMessage}</p>
                {errorCode && errorCode !== 'unknown' && (
                  <p className="text-red-600 text-xs mt-2">Mã lỗi: {errorCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-gray-700 text-sm mb-2">
              <strong>Đơn hàng của bạn đã được tạo</strong> nhưng thanh toán chưa được xử lý.
            </p>
            <p className="text-gray-600 text-sm">
              Bạn có thể thanh toán lại đơn hàng này từ trang chi tiết đơn hàng.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {orderId && (
              <Link href={`/orders/${orderId}`}>
                <Button className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Xem đơn hàng
                </Button>
              </Link>
            )}
            <Link href="/orders">
              <Button variant="outline" className="w-full sm:w-auto">
                Danh sách đơn hàng
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Về trang chủ
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Nếu bạn gặp vấn đề với thanh toán, vui lòng liên hệ{' '}
              <Link href="/contact" className="text-blue-600 hover:underline">
                bộ phận hỗ trợ
              </Link>{' '}
              hoặc thử lại sau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

