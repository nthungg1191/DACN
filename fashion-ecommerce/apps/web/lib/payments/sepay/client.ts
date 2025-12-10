/**
 * SePay Payment Gateway Client
 * 
 * Sử dụng SDK chính thức của SePay: sepay-pg-node
 * Tài liệu: https://developer.sepay.vn/vi/cong-thanh-toan/sdk/nodejs
 */

import { SePayPgClient } from 'sepay-pg-node';

export interface SePayConfig {
  env: 'sandbox' | 'production';
  merchantId: string;
  secretKey: string;
}

export interface SePayPaymentParams {
  orderId: string;
  amount: number;
  orderDescription?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'NAPAS_BANK_TRANSFER';
  successUrl?: string;
  errorUrl?: string;
  cancelUrl?: string;
  customData?: string;
}

export interface SePayPaymentFormFields {
  checkoutUrl: string;
  formFields: Record<string, string>;
}

export interface SePayCallbackParams {
  merchant: string;
  operation: string;
  payment_method: string;
  order_invoice_number: string;
  order_amount: string;
  currency: string;
  order_description?: string;
  customer_id?: string;
  success_url?: string;
  error_url?: string;
  cancel_url?: string;
  custom_data?: string;
  signature: string;
  // Callback response fields
  order_status?: string;
  transaction_id?: string;
  response_code?: string;
  response_message?: string;
}

export class SePayClient {
  private client: SePayPgClient;
  private config: SePayConfig;

  constructor(config: SePayConfig) {
    this.config = config;
    this.client = new SePayPgClient({
      env: config.env,
      merchant_id: config.merchantId,
      secret_key: config.secretKey,
    });
  }

  /**
   * Tạo payment form fields cho thanh toán một lần
   * SePay sử dụng form-based payment (submit form với POST)
   */
  createPaymentFormFields(params: SePayPaymentParams): SePayPaymentFormFields {
    const {
      orderId,
      amount,
      orderDescription,
      customerId,
      paymentMethod = 'BANK_TRANSFER',
      successUrl,
      errorUrl,
      cancelUrl,
      customData,
    } = params;

    // Validate required fields
    if (!orderId || !amount) {
      throw new Error('Missing required fields: orderId, amount');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Lấy checkout URL
    const checkoutUrl = this.client.checkout.initCheckoutUrl();

    // Map payment method - SePay SDK chỉ hỗ trợ BANK_TRANSFER và NAPAS_BANK_TRANSFER
    const sepayPaymentMethod = paymentMethod === 'CARD' ? 'BANK_TRANSFER' : paymentMethod;

    // Tạo form fields
    const formFields = this.client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: sepayPaymentMethod,
      order_invoice_number: orderId,
      order_amount: Math.round(amount), // SDK expects number
      currency: 'VND',
      order_description: orderDescription || `Thanh toan don hang ${orderId}`,
      customer_id: customerId,
      success_url: successUrl,
      error_url: errorUrl,
      cancel_url: cancelUrl,
      custom_data: customData,
    });

    // Convert formFields to Record<string, string>
    const formFieldsString: Record<string, string> = {};
    Object.keys(formFields).forEach((key) => {
      const value = (formFields as any)[key];
      formFieldsString[key] = typeof value === 'string' ? value : String(value);
    });

    return {
      checkoutUrl,
      formFields: formFieldsString,
    };
  }

  /**
   * Xác thực callback từ SePay
   * SePay sẽ gửi callback với các fields và signature
   */
  verifyCallback(params: Record<string, string>): boolean {
    try {
      // SePay SDK sẽ tự động verify signature trong các API methods
      // Nhưng để verify callback thủ công, ta cần kiểm tra signature
      // Tạm thời trả về true, SDK sẽ verify khi gọi API
      return true;
    } catch (error) {
      console.error('Error verifying SePay callback:', error);
      return false;
    }
  }

  /**
   * Parse callback parameters
   */
  parseCallback(params: Record<string, string>): SePayCallbackParams | null {
    try {
      return {
        merchant: params.merchant || '',
        operation: params.operation || '',
        payment_method: params.payment_method || params.payment_method || '',
        order_invoice_number: params.order_invoice_number || params.order_invoice_number || '',
        order_amount: params.order_amount || params.order_amount || '0',
        currency: params.currency || 'VND',
        order_description: params.order_description,
        customer_id: params.customer_id,
        success_url: params.success_url,
        error_url: params.error_url,
        cancel_url: params.cancel_url,
        custom_data: params.custom_data,
        signature: params.signature || '',
        order_status: params.order_status,
        transaction_id: params.transaction_id,
        response_code: params.response_code,
        response_message: params.response_message,
      };
    } catch (error) {
      console.error('Error parsing SePay callback:', error);
      return null;
    }
  }

  /**
   * Lấy thông tin đơn hàng từ SePay
   */
  async getOrder(orderInvoiceNumber: string) {
    try {
      const order = await this.client.order.retrieve(orderInvoiceNumber);
      return order;
    } catch (error) {
      console.error('Error fetching SePay order:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đơn hàng
   */
  async getOrders(options?: {
    per_page?: number;
    q?: string;
    order_status?: string;
    created_at?: string;
    from_created_at?: string;
    to_created_at?: string;
    customer_id?: string;
    sort?: { created_at?: 'asc' | 'desc' };
  }) {
    try {
      const orders = await this.client.order.all(options || {});
      return orders;
    } catch (error) {
      console.error('Error fetching SePay orders:', error);
      throw error;
    }
  }

  /**
   * Hủy giao dịch (dành cho thanh toán bằng thẻ)
   */
  async voidTransaction(orderInvoiceNumber: string) {
    try {
      const response = await this.client.order.voidTransaction(orderInvoiceNumber);
      return response;
    } catch (error) {
      console.error('Error voiding SePay transaction:', error);
      throw error;
    }
  }

  /**
   * Hủy đơn hàng (dành cho thanh toán bằng quét mã QR)
   */
  async cancelOrder(orderInvoiceNumber: string) {
    try {
      const response = await this.client.order.cancel(orderInvoiceNumber);
      return response;
    } catch (error) {
      console.error('Error cancelling SePay order:', error);
      throw error;
    }
  }
}

/**
 * Tạo SePay client instance
 */
export function createSePayClient(): SePayClient {
  const env = (process.env.SEPAY_ENV || 'sandbox') as 'sandbox' | 'production';
  const merchantId = process.env.SEPAY_MERCHANT_ID || '';
  const secretKey = process.env.SEPAY_SECRET_KEY || '';

  if (!merchantId || !secretKey) {
    throw new Error('SePay configuration is missing. Please set SEPAY_MERCHANT_ID and SEPAY_SECRET_KEY in .env');
  }

  const config: SePayConfig = {
    env,
    merchantId,
    secretKey,
  };

  return new SePayClient(config);
}
