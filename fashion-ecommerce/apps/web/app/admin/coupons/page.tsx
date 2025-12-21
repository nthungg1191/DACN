'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/useToast';
import { Modal } from '@/components/modals/Modal';
import Link from 'next/link';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeFilter, setActiveFilter] = useState<string | null>(
    searchParams.get('active') || null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 0,
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    active: true,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (search) params.set('search', search);
      if (activeFilter !== null) params.set('active', activeFilter);

      const response = await fetch(`/api/admin/coupons?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCoupons(data.data.coupons);
        setPagination(data.data.pagination);
      } else {
        toastError('Lỗi', data.error || 'Không thể tải danh sách mã giảm giá');
      }
    } catch (error) {
      toastError('Lỗi', 'Đã xảy ra lỗi khi tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [pagination.page, search, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCoupons();
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrderAmount: '',
      maxDiscountAmount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: '',
      active: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: typeof coupon.value === 'object' && 'toNumber' in coupon.value
        ? coupon.value.toNumber()
        : Number(coupon.value),
      minOrderAmount: coupon.minOrderAmount
        ? (typeof coupon.minOrderAmount === 'object' && 'toNumber' in coupon.minOrderAmount
            ? coupon.minOrderAmount.toNumber()
            : Number(coupon.minOrderAmount)).toString()
        : '',
      maxDiscountAmount: coupon.maxDiscountAmount
        ? (typeof coupon.maxDiscountAmount === 'object' && 'toNumber' in coupon.maxDiscountAmount
            ? coupon.maxDiscountAmount.toNumber()
            : Number(coupon.maxDiscountAmount)).toString()
        : '',
      usageLimit: coupon.usageLimit?.toString() || '',
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      active: coupon.active,
      description: coupon.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = {
        code: formData.code,
        type: formData.type,
        value: formData.value,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        active: formData.active,
        description: formData.description || null,
      };

      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      const method = editingCoupon ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toastError('Lỗi', data.error || 'Không thể lưu mã giảm giá');
        return;
      }

      toastSuccess('Thành công', editingCoupon ? 'Đã cập nhật mã giảm giá' : 'Đã tạo mã giảm giá');
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      toastError('Lỗi', 'Đã xảy ra lỗi khi lưu mã giảm giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toastError('Lỗi', data.error || 'Không thể xóa mã giảm giá');
        return;
      }

      toastSuccess('Thành công', 'Đã xóa mã giảm giá');
      fetchCoupons();
    } catch (error) {
      toastError('Lỗi', 'Đã xảy ra lỗi khi xóa mã giảm giá');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isNotStarted = (validFrom: string) => {
    return new Date(validFrom) > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý mã giảm giá</h1>
          <p className="text-gray-600 mt-1">Tạo và quản lý mã giảm giá</p>
        </div>
        <Button onClick={handleOpenCreateModal}>+ Thêm mã giảm giá</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <Input
            type="text"
            placeholder="Tìm kiếm theo mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <select
            value={activeFilter || ''}
            onChange={(e) => setActiveFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã vô hiệu hóa</option>
          </select>
          <Button type="submit">Tìm kiếm</Button>
        </form>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Đang tải...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có mã giảm giá nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn tối thiểu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon.validUntil);
                  const notStarted = isNotStarted(coupon.validFrom);
                  const statusBadge =
                    !coupon.active
                      ? 'bg-gray-100 text-gray-800'
                      : expired
                      ? 'bg-red-100 text-red-800'
                      : notStarted
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800';

                  const statusText =
                    !coupon.active
                      ? 'Vô hiệu hóa'
                      : expired
                      ? 'Hết hạn'
                      : notStarted
                      ? 'Chưa bắt đầu'
                      : 'Đang hoạt động';

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {coupon.type === 'PERCENTAGE' ? 'Theo %' : 'Số tiền cố định'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.type === 'PERCENTAGE'
                            ? `${typeof coupon.value === 'object' && 'toNumber' in coupon.value ? coupon.value.toNumber() : Number(coupon.value)}%`
                            : formatCurrency(typeof coupon.value === 'object' && 'toNumber' in coupon.value ? coupon.value.toNumber() : Number(coupon.value))}
                          {coupon.maxDiscountAmount &&
                            coupon.type === 'PERCENTAGE' && (
                              <span className="text-xs text-gray-500 block">
                                Tối đa: {formatCurrency(typeof coupon.maxDiscountAmount === 'object' && 'toNumber' in coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toNumber() : Number(coupon.maxDiscountAmount))}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.minOrderAmount
                            ? formatCurrency(typeof coupon.minOrderAmount === 'object' && 'toNumber' in coupon.minOrderAmount ? coupon.minOrderAmount.toNumber() : Number(coupon.minOrderAmount))
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.usedCount}
                          {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Từ: {formatDate(coupon.validFrom)}</div>
                          <div>Đến: {formatDate(coupon.validUntil)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenEditModal(coupon)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} trong tổng số{' '}
              {pagination.totalCount} mã giảm giá
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrev}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Mã giảm giá *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
              placeholder="Ví dụ: SALE2024"
            />
          </div>

          <div>
            <Label htmlFor="type">Loại giảm giá *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'PERCENTAGE' | 'FIXED',
                })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="PERCENTAGE">Theo phần trăm (%)</option>
              <option value="FIXED">Số tiền cố định (₫)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="value">
              Giá trị giảm giá * ({formData.type === 'PERCENTAGE' ? '%' : '₫'})
            </Label>
            <Input
              id="value"
              type="number"
              step={formData.type === 'PERCENTAGE' ? '0.01' : '1000'}
              min="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrderAmount">Đơn hàng tối thiểu (₫)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="1000"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: e.target.value })
                }
                placeholder="Không bắt buộc"
              />
            </div>

            {formData.type === 'PERCENTAGE' && (
              <div>
                <Label htmlFor="maxDiscountAmount">Giảm tối đa (₫)</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.maxDiscountAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDiscountAmount: e.target.value })
                  }
                  placeholder="Không bắt buộc"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="usageLimit">Số lần sử dụng tối đa</Label>
            <Input
              id="usageLimit"
              type="number"
              min="1"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Không giới hạn nếu để trống"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Ngày bắt đầu *</Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="validUntil">Ngày kết thúc *</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả về mã giảm giá..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="active" className="ml-2">
              Kích hoạt mã giảm giá
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : editingCoupon ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

