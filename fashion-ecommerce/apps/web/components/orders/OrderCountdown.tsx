'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface OrderCountdownProps {
  createdAt: string | Date;
  expiryMinutes?: number;
  onExpired?: () => void;
  className?: string;
}

/**
 * Component hiển thị countdown timer cho order PENDING
 * Tự động hủy đơn khi hết thời gian
 */
export function OrderCountdown({
  createdAt,
  expiryMinutes = 10,
  onExpired,
  className = '',
}: OrderCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const orderDate = new Date(createdAt);
    const expiryTime = new Date(orderDate.getTime() + expiryMinutes * 60 * 1000);
    const now = new Date();

    // Tính thời gian còn lại (milliseconds)
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = expiryTime.getTime() - now.getTime();
      return Math.max(0, Math.floor(diff / 1000)); // Convert to seconds
    };

    // Set initial time
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    setIsExpired(initialTimeLeft === 0);

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiryMinutes, onExpired, isExpired]);

  // Format time: MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate percentage for progress bar
  const totalSeconds = expiryMinutes * 60;
  const percentage = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));

  if (isExpired) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Đơn hàng đã hết thời gian thanh toán</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Đơn hàng đã tự động bị hủy do quá thời gian thanh toán.
        </p>
      </div>
    );
  }

  // Warning when less than 2 minutes left
  const isWarning = timeLeft < 2 * 60;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isWarning
          ? 'bg-orange-50 border-orange-200'
          : 'bg-yellow-50 border-yellow-200'
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-5 h-5 ${isWarning ? 'text-orange-600' : 'text-yellow-600'}`} />
        <span
          className={`font-semibold ${
            isWarning ? 'text-orange-800' : 'text-yellow-800'
          }`}
        >
          Thời gian còn lại để thanh toán
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2 mb-2">
          <span
            className={`text-3xl font-bold ${
              isWarning ? 'text-orange-600' : 'text-yellow-600'
            }`}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-gray-600">
            ({Math.floor(timeLeft / 60)} phút {timeLeft % 60} giây)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isWarning ? 'bg-orange-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {isWarning && (
        <p className="text-sm text-orange-700 mt-2 font-medium">
          ⚠️ Vui lòng hoàn tất thanh toán ngay để tránh đơn hàng bị hủy tự động
        </p>
      )}
    </div>
  );
}

