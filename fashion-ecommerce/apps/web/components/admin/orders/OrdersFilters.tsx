'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export function OrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update all filter params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set('page', '1');

    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatus(value);
    updateFilters({ status: value });
  };

  const handlePaymentStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPaymentStatus(value);
    updateFilters({ paymentStatus: value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleDateFilter = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    updateFilters({ dateFrom: from, dateTo: to });
  };

  const clearFilters = () => {
    setStatus('');
    setPaymentStatus('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    router.push('/admin/orders');
  };

  const hasActiveFilters = status || paymentStatus || search || dateFrom || dateTo;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="space-y-4">
        {/* Search and Main Filters Row */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn, tên khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </form>

          {/* Status Filter */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="SHIPPED">Đã giao hàng</option>
            <option value="DELIVERED">Đã nhận hàng</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatus}
            onChange={handlePaymentStatusChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="FAILED">Thanh toán thất bại</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm text-gray-600">Lọc theo ngày:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFilter(e.target.value, dateTo)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Từ ngày"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateFilter(dateFrom, e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Đến ngày"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => handleDateFilter('', '')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

