'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { useToast } from '@/components/ui/Toast';
import { 
  User, 
  Package, 
  MapPin, 
  CreditCard, 
  FileText, 
  X, 
  CheckCircle,
  AlertCircle,
  Printer,
  Download,
  Copy,
  Check
} from 'lucide-react';

interface OrderDetailClientProps {
  order: any;
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState(order.notes || '');
  const [newNote, setNewNote] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return '0 ₫';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numAmount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
      SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
      DELIVERED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PAID: 'bg-green-100 text-green-800 border-green-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200',
      REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      PROCESSING: 'Đang xử lý',
      SHIPPED: 'Đã giao hàng',
      DELIVERED: 'Đã nhận hàng',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      FAILED: 'Thanh toán thất bại',
      REFUNDED: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === order.status) return;
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!pendingStatus || updating) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
        setShowStatusModal(false);
        setPendingStatus(null);
        toast({
          title: 'Cập nhật thành công',
          description: `Trạng thái đơn hàng đã được cập nhật thành "${getStatusLabel(pendingStatus)}"`,
          type: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Cập nhật thất bại',
          description: data.error || 'Lỗi không xác định',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi cập nhật trạng thái',
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusChange = (newPaymentStatus: string) => {
    if (newPaymentStatus === order.paymentStatus) return;
    setPendingPaymentStatus(newPaymentStatus);
    setShowPaymentModal(true);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!pendingPaymentStatus || updating) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: pendingPaymentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
        setShowPaymentModal(false);
        setPendingPaymentStatus(null);
        toast({
          title: 'Cập nhật thành công',
          description: `Trạng thái thanh toán đã được cập nhật thành "${getPaymentStatusLabel(pendingPaymentStatus)}"`,
          type: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Cập nhật thất bại',
          description: data.error || 'Lỗi không xác định',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi cập nhật trạng thái thanh toán',
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNote || notes }),
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
        setNotes(data.data.notes || '');
        setNewNote('');
        toast({
          title: 'Lưu thành công',
          description: 'Ghi chú đã được cập nhật',
          type: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Lưu thất bại',
          description: data.error || 'Lỗi không xác định',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi cập nhật ghi chú',
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
        setShowCancelModal(false);
        toast({
          title: 'Hủy đơn hàng thành công',
          description: 'Đơn hàng đã được hủy và số lượng sản phẩm đã được khôi phục vào kho',
          type: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Hủy đơn hàng thất bại',
          description: data.error || 'Lỗi không xác định',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi hủy đơn hàng',
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast({
        title: 'Đã sao chép',
        description: `Mã đơn hàng "${order.orderNumber}" đã được sao chép`,
        type: 'success',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể sao chép mã đơn hàng',
        type: 'error',
      });
    }
  };

  const shippingAddress = typeof order.shippingAddress === 'string' 
    ? JSON.parse(order.shippingAddress) 
    : order.shippingAddress;
  
  const billingAddress = typeof order.billingAddress === 'string'
    ? JSON.parse(order.billingAddress)
    : order.billingAddress;

  return (
    <>
      {/* Order Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin đơn hàng</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyOrderNumber}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
                title="Sao chép mã đơn hàng"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Mã đơn: <span className="font-medium text-gray-700">{order.orderNumber}</span></span>
              <span>•</span>
              <span>Ngày tạo: {formatDate(order.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(
                order.status
              )}`}
            >
              {getStatusLabel(order.status)}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full border ${getPaymentStatusBadge(
                order.paymentStatus
              )}`}
            >
              {getPaymentStatusLabel(order.paymentStatus)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="SHIPPED">Đã giao hàng</option>
              <option value="DELIVERED">Đã nhận hàng</option>
            </select>
          )}

          {order.paymentStatus !== 'REFUNDED' && (
            <select
              value={order.paymentStatus}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
              disabled={updating}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="FAILED">Thanh toán thất bại</option>
              <option value="REFUNDED">Đã hoàn tiền</option>
            </select>
          )}

          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(true)}
              disabled={updating}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Hủy đơn hàng
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="text-gray-600"
          >
            <Printer className="w-4 h-4 mr-2" />
            In hóa đơn
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Thông tin khách hàng</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Tên khách hàng</p>
                <p className="text-base font-medium text-gray-900">
                  {order.user?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base text-gray-900">{order.user?.email || 'N/A'}</p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <Link
                  href={`/admin/customers/${order.user?.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem chi tiết khách hàng →
                </Link>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Sản phẩm trong đơn</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Giá
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tổng
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.product?.images && item.product.images.length > 0 && (
                            <img
                              src={Array.isArray(item.product.images) 
                                ? item.product.images[0] 
                                : item.product.images}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <Link
                              href={`/products/${item.product?.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {item.product?.name || 'N/A'}
                            </Link>
                            <p className="text-xs text-gray-500 mt-1">
                              SKU: {item.product?.id?.substring(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ghi chú</h3>
            </div>
            <div className="space-y-3">
              {order.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
              <div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Thêm ghi chú mới..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  onClick={handleUpdateNotes}
                  disabled={updating || !newNote.trim()}
                  className="mt-2"
                  size="sm"
                >
                  {updating ? 'Đang lưu...' : 'Lưu ghi chú'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-medium">{shippingAddress?.fullName || 'N/A'}</p>
              <p>{shippingAddress?.phone || ''}</p>
              <p className="text-gray-600">
                {shippingAddress?.street || ''}
                {shippingAddress?.street && shippingAddress?.city && ', '}
                {shippingAddress?.city || ''}
                {shippingAddress?.city && shippingAddress?.state && ', '}
                {shippingAddress?.state || ''}
                {shippingAddress?.postalCode && ` ${shippingAddress.postalCode}`}
              </p>
            </div>
          </div>

          {/* Billing Address */}
          {billingAddress && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Địa chỉ thanh toán</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">{billingAddress?.fullName || 'N/A'}</p>
                <p>{billingAddress?.phone || ''}</p>
                <p className="text-gray-600">
                  {billingAddress?.street || ''}
                  {billingAddress?.street && billingAddress?.city && ', '}
                  {billingAddress?.city || ''}
                  {billingAddress?.city && billingAddress?.state && ', '}
                  {billingAddress?.state || ''}
                  {billingAddress?.postalCode && ` ${billingAddress.postalCode}`}
                </p>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Thanh toán</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Phương thức:</span>
                <span className="font-medium text-gray-900">{order.paymentMethod || 'N/A'}</span>
              </div>
              {order.paymentGateway && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Gateway:</span>
                  <span className="font-medium text-gray-900">{order.paymentGateway}</span>
                </div>
              )}
              {order.paymentTransactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-medium text-gray-900 text-xs">
                    {order.paymentTransactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Thuế:</span>
                <span className="text-gray-900">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="text-gray-900">{formatCurrency(order.shipping)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận hủy đơn hàng</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này sẽ khôi phục số lượng sản phẩm
              vào kho.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={updating}
              >
                {updating ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Confirmation Modal */}
      {showStatusModal && pendingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận thay đổi trạng thái</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Trạng thái hiện tại:</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Trạng thái mới:</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(pendingStatus)}`}>
                {getStatusLabel(pendingStatus)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setPendingStatus(null);
                }}
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Đang cập nhật...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Status Confirmation Modal */}
      {showPaymentModal && pendingPaymentStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận thay đổi trạng thái thanh toán</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Trạng thái hiện tại:</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getPaymentStatusBadge(order.paymentStatus)}`}>
                {getPaymentStatusLabel(order.paymentStatus)}
              </span>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Trạng thái mới:</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getPaymentStatusBadge(pendingPaymentStatus)}`}>
                {getPaymentStatusLabel(pendingPaymentStatus)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn thay đổi trạng thái thanh toán?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPendingPaymentStatus(null);
                }}
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdatePaymentStatus}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Đang cập nhật...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

