'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/useApp';
import { useAddresses } from '@/hooks/useSWR';
import { AddressCard } from '@/components/addresses/AddressCard';
import { AddressForm } from '@/components/addresses/AddressForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/useToast';
import { Modal } from '@/components/modals/Modal';
import Link from 'next/link';
import Image from 'next/image';

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

type Step = 1 | 2 | 3;

/**
 * Helper function để submit SePay payment form
 * SePay sử dụng form-based payment (POST form)
 */
function submitSePayForm(checkoutUrl: string, formFields: Record<string, string>) {
  // Tạo form ẩn
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';

  // Thêm tất cả form fields
  Object.keys(formFields).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = formFields[key];
    form.appendChild(input);
  });

  // Thêm form vào body và submit
  document.body.appendChild(form);
  form.submit();
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { cart } = useApp();
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const { success: toastSuccess, error: toastError } = useToast();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<Address | null>(null);
  const [useDifferentBilling, setUseDifferentBilling] = useState(false);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD'>('COD');
  const [notes, setNotes] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Redirect if not authenticated (only after session has loaded)
  useEffect(() => {
    // Don't redirect while session is loading
    if (status === 'loading') {
      return;
    }

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
        
        // Check if there's a callbackUrl in the current URL (means we just came from signin)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('callbackUrl')) {
          // We're being redirected back from signin, wait for session to update
          return;
        }
        
        hasRedirectedRef.current = true;
        // Use window.location.href instead of router.push to avoid NextAuth message channel issues
        const callbackUrl = encodeURIComponent('/checkout');
        window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
      }
    }
    
    // Reset redirect flag when authenticated (allows redirect again if user logs out)
    if (status === 'authenticated') {
      hasRedirectedRef.current = false;
    }
  }, [status]);

  // Set default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedShippingAddress) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedShippingAddress(defaultAddress);
      setSelectedBillingAddress(defaultAddress);
    }
  }, [addresses, selectedShippingAddress]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart.isLoading && (!cart.items || cart.items.length === 0)) {
      router.push('/cart');
    }
  }, [cart, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const calculateTotals = () => {
    const subtotal = cart.totalPrice || 0;
    const shipping = 0; // Free shipping
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  const { subtotal, shipping, tax, total } = calculateTotals();

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedShippingAddress) {
        toastError('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
        return;
      }
      if (useDifferentBilling && !selectedBillingAddress) {
        toastError('Lỗi', 'Vui lòng chọn địa chỉ thanh toán');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const syncCartToDatabase = async () => {
    // Sync cart items from localStorage to database
    if (!cart.items || cart.items.length === 0) {
      return;
    }

    try {
      // Fetch current cart from database
      const cartResponse = await fetch('/api/cart');
      const cartData = await cartResponse.json();
      
      if (!cartData.success) {
        throw new Error('Failed to fetch cart from database');
      }

      const dbCartItems = cartData.data?.cart?.items || [];
      
      // Group items by productId (since database doesn't support size/color for cart items)
      const itemsByProductId = new Map<string, number>();
      for (const item of cart.items) {
        const currentQuantity = itemsByProductId.get(item.productId) || 0;
        itemsByProductId.set(item.productId, currentQuantity + item.quantity);
      }

      // Sync each product to database
      for (const [productId, totalQuantity] of itemsByProductId.entries()) {
        // Check if item exists in database cart (match by productId only)
        const dbItem = dbCartItems.find((dbItem: any) => dbItem.productId === productId);

        if (dbItem) {
          // Item exists - update quantity if different
          if (dbItem.quantity !== totalQuantity) {
            const updateResponse = await fetch(`/api/cart/items/${dbItem.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                quantity: totalQuantity,
              }),
            });

            if (!updateResponse.ok) {
              console.warn(`Failed to update item ${productId} in database`);
            }
          }
        } else {
          // Item doesn't exist - add it to database
          const syncResponse = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: productId,
              quantity: totalQuantity,
            }),
          });

          if (!syncResponse.ok) {
            console.warn(`Failed to add item ${productId} to database`);
          }
        }
      }

      // Remove items from database that are not in localStorage
      for (const dbItem of dbCartItems) {
        const localItemExists = itemsByProductId.has(dbItem.productId);

        if (!localItemExists) {
          // Item exists in database but not in localStorage - remove it
          const deleteResponse = await fetch(`/api/cart/items/${dbItem.id}`, {
            method: 'DELETE',
          });

          if (!deleteResponse.ok) {
            console.warn(`Failed to remove item ${dbItem.id} from database`);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing cart to database:', error);
      // Don't throw - continue with order creation
    }
  };

  const handleCreateOrder = async () => {
    // Validate cart first
    if (!cart.items || cart.items.length === 0) {
      toastError('Lỗi', 'Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm vào giỏ hàng.');
      router.push('/cart');
      return;
    }

    if (!selectedShippingAddress) {
      toastError('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (useDifferentBilling && !selectedBillingAddress) {
      toastError('Lỗi', 'Vui lòng chọn địa chỉ thanh toán');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sync cart from localStorage to database before creating order
      await syncCartToDatabase();

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddressId: selectedShippingAddress.id,
          billingAddressId: useDifferentBilling ? selectedBillingAddress?.id : selectedShippingAddress.id,
          paymentMethod,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle specific error cases with better messages
        let errorMessage = 'Có lỗi xảy ra khi tạo đơn hàng';
        
        if (error.error === 'Cart is empty') {
          errorMessage = 'Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm vào giỏ hàng.';
          setTimeout(() => router.push('/cart'), 2000);
        } else if (error.error === 'Shipping address not found') {
          errorMessage = 'Địa chỉ giao hàng không hợp lệ. Vui lòng chọn lại địa chỉ.';
        } else if (error.error === 'Billing address not found') {
          errorMessage = 'Địa chỉ thanh toán không hợp lệ. Vui lòng chọn lại địa chỉ.';
        } else if (error.error?.includes('Insufficient stock')) {
          errorMessage = error.error || 'Sản phẩm không đủ số lượng trong kho.';
          setTimeout(() => router.push('/cart'), 2000);
        } else if (error.error) {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.details) {
          errorMessage = `${error.error || 'Lỗi'}: ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // API returns { success: true, data: order }
      const order = responseData.data || responseData;

      // Kiểm tra nếu là phương thức thanh toán online
      if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'BANK_TRANSFER') {
        // Xác định payment gateway dựa trên payment method
        const paymentGateway = paymentMethod === 'CREDIT_CARD' ? 'VNPay' : 'SePay';
        const paymentApiEndpoint = paymentMethod === 'CREDIT_CARD' 
          ? '/api/payments/vnpay/create' 
          : '/api/payments/sepay/create';

        // Tạo payment URL và redirect đến payment gateway
        try {
          console.log(`Creating payment URL for order: ${order.id} with gateway: ${paymentGateway}`);
          
          const paymentResponse = await fetch(paymentApiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order.id,
            }),
          });

          console.log('Payment response status:', paymentResponse.status);

          if (!paymentResponse.ok) {
            const paymentError = await paymentResponse.json();
            console.error('Payment API error:', paymentError);
            throw new Error(paymentError.error || 'Có lỗi xảy ra khi tạo payment URL');
          }

          const paymentData = await paymentResponse.json();
          console.log('Payment data:', paymentData);
          
          if (paymentGateway === 'SePay') {
            // SePay sử dụng form-based payment
            const checkoutUrl = paymentData.data?.checkoutUrl;
            const formFields = paymentData.data?.formFields;

            if (!checkoutUrl || !formFields) {
              console.error('Invalid SePay payment data:', paymentData);
              throw new Error('Không nhận được form fields hợp lệ từ SePay');
            }

            console.log(`Submitting SePay form for order: ${order.orderNumber}`);
            
            toastSuccess(
              'Đang chuyển hướng đến cổng thanh toán...',
              `Đơn hàng ${order.orderNumber} đã được tạo thành công`
            );

            // Tạo và submit form SePay
            submitSePayForm(checkoutUrl, formFields);
            return; // Đảm bảo không chạy code sau đó
          } else {
            // VNPay sử dụng redirect URL
            const paymentUrl = paymentData.data?.paymentUrl || paymentData.paymentUrl;

            if (paymentUrl && typeof paymentUrl === 'string' && paymentUrl.startsWith('http')) {
              console.log(`Redirecting to ${paymentGateway}:`, paymentUrl);
              
              toastSuccess(
                'Đang chuyển hướng đến cổng thanh toán...',
                `Đơn hàng ${order.orderNumber} đã được tạo thành công`
              );

              // Redirect đến payment gateway
              window.location.replace(paymentUrl);
              return; // Đảm bảo không chạy code sau đó
            } else {
              console.error('Invalid payment URL:', paymentUrl);
              throw new Error('Không nhận được payment URL hợp lệ từ server');
            }
          }
        } catch (paymentError: any) {
          console.error('Payment creation error:', paymentError);
          toastError(
            'Lỗi thanh toán',
            paymentError.message || 'Có lỗi xảy ra khi tạo payment URL. Đơn hàng đã được tạo, vui lòng thanh toán sau.'
          );
          // Fallback: redirect đến order detail page
          router.push(`/orders/${order.id}`);
        }
      } else {
        // COD - giữ nguyên flow hiện tại
        toastSuccess(
          'Đặt hàng thành công!',
          `Đơn hàng ${order.orderNumber} đã được tạo thành công`
        );

        router.push(`/orders/${order.id}`);
      }
    } catch (error: any) {
      toastError('Lỗi', error.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while session, cart or addresses are loading
  if (status === 'loading' || cart.isLoading || addressesLoading) {
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

  if (!cart.items || cart.items.length === 0) {
    return null; // Will redirect
  }

  const steps = [
    { number: 1, title: 'Thông tin giao hàng', description: 'Chọn địa chỉ giao hàng' },
    { number: 2, title: 'Phương thức thanh toán', description: 'Chọn cách thanh toán' },
    { number: 3, title: 'Xác nhận đơn hàng', description: 'Kiểm tra và hoàn tất' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                        currentStep >= step.number
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-sm font-medium ${
                          currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Địa chỉ giao hàng</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(true)}
                >
                  Thêm địa chỉ mới
                </Button>
              </div>

              {addresses && addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedShippingAddress(address)}
                      className={`cursor-pointer transition ${
                        selectedShippingAddress?.id === address.id
                          ? 'ring-2 ring-blue-500'
                          : ''
                      }`}
                    >
                      <AddressCard
                        address={address}
                        showSelect={false}
                        showActions={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Bạn chưa có địa chỉ nào</p>
                  <Button onClick={() => setIsFormOpen(true)}>Thêm địa chỉ mới</Button>
                </div>
              )}
                </div>

                {/* Billing Address */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <input
                      id="useDifferentBilling"
                      type="checkbox"
                      checked={useDifferentBilling}
                      onChange={(e) => setUseDifferentBilling(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="useDifferentBilling" className="ml-2">
                      Sử dụng địa chỉ thanh toán khác
                    </Label>
                  </div>

                  {useDifferentBilling && (
                    <div className="mt-4 space-y-4">
                      {addresses?.map((address) => (
                        <div
                          key={address.id}
                          onClick={() => setSelectedBillingAddress(address)}
                          className={`cursor-pointer transition ${
                            selectedBillingAddress?.id === address.id
                              ? 'ring-2 ring-blue-500'
                              : ''
                          }`}
                        >
                          <AddressCard
                            address={address}
                            showSelect={false}
                            showActions={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step Navigation */}
                <div className="flex justify-end">
                  <Button onClick={handleNextStep} size="lg">
                    Tiếp tục
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                        <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="BANK_TRANSFER"
                        checked={paymentMethod === 'BANK_TRANSFER'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Chuyển khoản ngân hàng</span>
                        <p className="text-sm text-gray-600">Chuyển khoản qua tài khoản ngân hàng</p>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CREDIT_CARD"
                        checked={paymentMethod === 'CREDIT_CARD'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Thẻ tín dụng</span>
                        <p className="text-sm text-gray-600">Thanh toán bằng thẻ Visa, Mastercard</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <Label htmlFor="notes">Ghi chú đơn hàng (tùy chọn)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú cho người bán..."
                  />
                </div>

                {/* Step Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePreviousStep} size="lg">
                    Quay lại
                  </Button>
                  <Button onClick={handleNextStep} size="lg">
                    Tiếp tục
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Order Confirmation */}
            {currentStep === 3 && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận đơn hàng</h2>

                  {/* Shipping Address Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Địa chỉ giao hàng</h3>
                    {selectedShippingAddress && (
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-900">{selectedShippingAddress.fullName}</p>
                        <p>{selectedShippingAddress.phone}</p>
                        <p>{selectedShippingAddress.street}</p>
                        <p>
                          {selectedShippingAddress.city}, {selectedShippingAddress.state}{' '}
                          {selectedShippingAddress.postalCode}
                        </p>
                        <p>{selectedShippingAddress.country}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Phương thức thanh toán</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900">
                        {paymentMethod === 'COD' && 'Thanh toán khi nhận hàng (COD)'}
                        {paymentMethod === 'BANK_TRANSFER' && 'Chuyển khoản ngân hàng'}
                        {paymentMethod === 'CREDIT_CARD' && 'Thẻ tín dụng'}
                      </p>
                    </div>
                  </div>

                  {/* Notes Summary */}
                  {notes && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ghi chú</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">{notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePreviousStep} size="lg">
                    Quay lại
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCreateOrder}
                    disabled={!selectedShippingAddress || isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Đơn hàng của bạn</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || '/images/products/product-placeholder.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        Số lượng: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Thuế (10%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Cart Summary Navigation - Only show on step 1 and 2 */}
              {(currentStep === 1 || currentStep === 2) && (
                <Link href="/cart" className="block mt-6">
                  <Button variant="outline" size="lg" className="w-full">
                    Quay lại giỏ hàng
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Thêm địa chỉ mới"
        size="lg"
      >
        <AddressForm
          onSuccess={() => {
            setIsFormOpen(false);
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
}

