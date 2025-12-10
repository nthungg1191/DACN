'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useOrders, useAddresses } from '@/hooks/useSWR';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { AddressForm } from '@/components/addresses/AddressForm';
import { AddressCard } from '@/components/addresses/AddressCard';
import { Modal } from '@/components/modals/Modal';
import Link from 'next/link';
import Image from 'next/image';
import { Package, MapPin, Settings, User, Menu, X, LogOut, Home, Lock, FileText } from 'lucide-react';

type Tab = 'info' | 'orders' | 'addresses' | 'password' | 'logout';

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success: toastSuccess, error: toastError, toasts, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasRedirectedRef = useRef(false);
  // Preload orders data immediately when authenticated - don't wait for tab click
  const { orders, isLoading: ordersLoading, mutate: mutateOrders } = useOrders(
    status === 'authenticated' ? { page: 1, limit: 5 } : undefined
  );
  const { addresses, isLoading: addressesLoading, mutate: mutateAddresses } = useAddresses();
  
  // Settings form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Address management state
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    // Only redirect if unauthenticated and we haven't redirected yet
    if (status === 'unauthenticated' && typeof window !== 'undefined' && !hasRedirectedRef.current) {
      // Prevent redirect loop: don't redirect if already on signin page
      if (window.location.pathname !== '/auth/signin') {
        // Check if we just came from signin page (to avoid immediate redirect after login)
        const fromSignin = sessionStorage.getItem('fromSignin');
        if (fromSignin) {
          // Clear the flag and wait a bit for session to update
          sessionStorage.removeItem('fromSignin');
          // Give NextAuth time to update the session after login
          // The page will re-render when session updates, so we don't need to check in setTimeout
          return;
        }
        
        hasRedirectedRef.current = true;
        // Use window.location.href instead of router.push to avoid NextAuth message channel issues
        const callbackUrl = encodeURIComponent('/profile');
        window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
      }
    }
    
    // Reset redirect flag when authenticated (allows redirect again if user logs out)
    if (status === 'authenticated') {
      hasRedirectedRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  // Auto-remove toasts after duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    toasts.forEach((toast) => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        timers.push(timer);
      }
    });
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      PROCESSING: 'Đang xử lý',
      SHIPPED: 'Đã giao hàng',
      DELIVERED: 'Đã nhận hàng',
      CANCELLED: 'Đã hủy',
    };
    return texts[status] || status;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra khi cập nhật thông tin');
      }

      toastSuccess('Thành công', 'Cập nhật thông tin thành công');
      // Reload session to reflect changes
      window.location.reload();
    } catch (error: any) {
      toastError('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toastError('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 6) {
      toastError('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra khi đổi mật khẩu');
      }

      toastSuccess('Thành công', 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toastError('Lỗi', error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error: any) {
      toastError('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
    }
  };

  // Show loading while session is loading
  if (status === 'loading') {
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

  const menuItems: Array<{
    id: Tab;
    label: string;
    icon: React.ComponentType<any>;
    isDanger?: boolean;
  }> = [
    { id: 'info', label: 'Thông tin tài khoản', icon: User },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: FileText },
    { id: 'addresses', label: 'Địa chỉ giao hàng', icon: MapPin },
    { id: 'password', label: 'Thay đổi mật khẩu', icon: Lock },
    { id: 'logout', label: 'Đăng xuất', icon: LogOut, isDanger: true },
  ];

  const handleMenuClick = (tab: Tab) => {
    if (tab === 'logout') {
      handleLogout();
      return;
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    
    // Revalidate orders when opening orders tab to ensure fresh data
    if (tab === 'orders' && status === 'authenticated') {
      mutateOrders();
    }
  };

  // Address management handlers
  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddressFormOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddressFormOpen(true);
  };

  const handleAddressFormSuccess = () => {
    setIsAddressFormOpen(false);
    setEditingAddress(null);
    mutateAddresses();
  };

  const handleAddressFormCancel = () => {
    setIsAddressFormOpen(false);
    setEditingAddress(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              <Home size={16} />
              <span>Trang chủ</span>
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Tài khoản</span>
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden mb-4 flex justify-end">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Menu */}
          <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Tài khoản</h2>
              </div>

              {/* Menu Items */}
              <nav className="p-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-1 ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : item.isDanger
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className={
                          isActive 
                            ? 'text-blue-600' 
                            : item.isDanger 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                        } 
                      />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Default Placeholder */}
            {activeTab === null && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
                <div className="text-center">
                  <User size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Chào mừng đến với trang tài khoản
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bạn đang ở trang tài khoản. Vui lòng chọn các mục bên trái để xem thông tin.
                  </p>
                </div>
              </div>
            )}

            {/* Account Info Tab */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông Tin Cá Nhân</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Họ và tên</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                  </Button>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Đơn hàng gần đây</h2>
                  <Link href="/orders">
                    <Button variant="outline">Xem tất cả</Button>
                  </Link>
                </div>

                {ordersLoading && (!orders || orders.length === 0) ? (
                  <div className="space-y-4">
                    {/* Loading skeleton */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="h-5 bg-gray-200 rounded w-32"></div>
                              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                          </div>
                          <div className="text-right">
                            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {orders.map((order: any) => (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="block p-6 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <p className="font-semibold text-gray-900">
                                  Đơn hàng #{order.orderNumber}
                                </p>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatPrice(Number(order.total))}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.items?.length || 0} sản phẩm
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
                    <Link href="/products">
                      <Button>Mua sắm ngay</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Địa chỉ giao hàng</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý địa chỉ giao hàng và thanh toán</p>
                  </div>
                  <Button onClick={handleAddAddress}>Thêm địa chỉ mới</Button>
                </div>

                {addressesLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải địa chỉ...</p>
                  </div>
                ) : addresses && addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((address: Address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        onEdit={handleEditAddress}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <MapPin size={64} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chưa có địa chỉ nào
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Thêm địa chỉ đầu tiên để bắt đầu mua sắm
                    </p>
                    <Button onClick={handleAddAddress}>Thêm địa chỉ mới</Button>
                  </div>
                )}

                {/* Address Form Modal */}
                <Modal
                  isOpen={isAddressFormOpen}
                  onClose={handleAddressFormCancel}
                  title={editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                  size="lg"
                >
                  <AddressForm
                    address={editingAddress}
                    onSuccess={handleAddressFormSuccess}
                    onCancel={handleAddressFormCancel}
                  />
                </Modal>
              </div>
            )}

            {/* Password Change Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Thay Đổi Mật Khẩu</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

