/**
 * VNPay Payment Gateway Client
 * 
 * Tài liệu: https://sandbox.vnpayment.vn/apis/
 * Code demo: vnpay_nodejs/vnpay_nodejs/routes/order.js
 */

import crypto from 'crypto';
import qs from 'qs';

export interface VNPayConfig {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
}

export interface VNPayPaymentParams {
  orderId: string;
  amount: number;
  orderDescription: string;
  orderType?: string;
  locale?: string;
  ipAddr?: string;
  createDate?: string;
  expireDate?: string;
}

export interface VNPayCallbackParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

export class VNPayClient {
  private config: VNPayConfig;

  constructor(config: VNPayConfig) {
    this.config = config;
  }

  /**
   * Tạo payment URL
   */
  createPaymentUrl(params: VNPayPaymentParams): string {
    const {
      orderId,
      amount,
      orderDescription,
      orderType = 'other',
      locale = 'vn',
      ipAddr,
      createDate,
      expireDate,
    } = params;

    // Validate required fields
    if (!orderId || !amount || !orderDescription) {
      throw new Error('Missing required fields: orderId, amount, orderDescription');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate orderId format (max 100 characters, alphanumeric)
    if (orderId.length > 100) {
      throw new Error('Order ID must be less than 100 characters');
    }

    const date = new Date();
    const createDateStr = createDate || this.formatDate(date);
    const expireDateStr = expireDate || this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 phút

    // Clean order description - remove special characters that might cause issues
    const cleanOrderDescription = this.cleanOrderDescription(orderDescription);

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: cleanOrderDescription,
      vnp_OrderType: orderType,
      vnp_Amount: Math.round(amount * 100).toString(), // VNPay yêu cầu amount tính bằng xu, làm tròn
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_CreateDate: createDateStr,
      vnp_ExpireDate: expireDateStr,
    };

    // Loại bỏ các field rỗng hoặc undefined
    const cleanedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(vnp_Params)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanedParams[key] = String(value);
      }
    }

    // Sắp xếp params theo thứ tự alphabet (giống code demo VNPay)
    const sortedParams = this.sortObject(cleanedParams);

    // Tạo query string RAW (không encode) để tính hash
    // Sử dụng qs.stringify với encode: false giống code demo VNPay
    const signData = qs.stringify(sortedParams, { encode: false });

    // Tạo secure hash từ query string RAW
    // Sử dụng Buffer giống code demo (mặc dù deprecated nhưng VNPay dùng cách này)
    const secureHash = this.createSecureHash(signData);

    // Debug logging (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== VNPay Payment URL Debug ===');
      console.log('Sorted Params:', JSON.stringify(sortedParams, null, 2));
      console.log('Query String (RAW):', signData);
      console.log('Hash Secret length:', this.config.hashSecret.length);
      console.log('Hash Secret (first 10 chars):', this.config.hashSecret.substring(0, 10) + '...');
      console.log('Hash Secret (last 10 chars):', '...' + this.config.hashSecret.substring(this.config.hashSecret.length - 10));
      console.log('Hash Algorithm: SHA512');
      console.log('Secure Hash:', secureHash);
      console.log('Secure Hash length:', secureHash.length);
    }

    // Thêm secure hash vào params và tạo URL
    // Giống code demo: thêm hash vào params, sau đó dùng qs.stringify với encode: false
    sortedParams['vnp_SecureHash'] = secureHash;
    const paymentUrl = `${this.config.url}?${qs.stringify(sortedParams, { encode: false })}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('Payment URL:', paymentUrl);
      console.log('================================');
    }

    return paymentUrl;
  }

  /**
   * Xác thực callback từ VNPay
   */
  verifyCallback(params: VNPayCallbackParams): boolean {
    const { vnp_SecureHash, ...otherParams } = params;

    // Loại bỏ các field rỗng và loại bỏ vnp_SecureHashType (theo tài liệu VNPay)
    const cleanedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(otherParams)) {
      // Loại bỏ vnp_SecureHashType và vnp_SecureHash (đã loại bỏ ở trên)
      if (key === 'vnp_SecureHashType' || key === 'vnp_SecureHash') {
        continue;
      }
      if (value !== undefined && value !== null && value !== '') {
        cleanedParams[key] = String(value);
      }
    }

    // Sắp xếp params theo thứ tự alphabet (giống code demo VNPay)
    const sortedParams = this.sortObject(cleanedParams);

    // Tạo query string RAW để tính hash (không encode)
    // Sử dụng qs.stringify với encode: false giống code demo VNPay
    const signData = qs.stringify(sortedParams, { encode: false });

    // Tạo secure hash
    const secureHash = this.createSecureHash(signData);

    // Debug logging (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== VNPay Callback Verification Debug ===');
      console.log('Sorted Params:', JSON.stringify(sortedParams, null, 2));
      console.log('Query String (RAW):', signData);
      console.log('Calculated Secure Hash:', secureHash);
      console.log('Received Secure Hash:', vnp_SecureHash);
      console.log('Hash Match:', secureHash === vnp_SecureHash);
      console.log('========================================');
    }

    // So sánh secure hash
    return secureHash === vnp_SecureHash;
  }

  /**
   * Tạo secure hash
   * VNPay yêu cầu sử dụng SHA512 (theo tài liệu chính thức)
   * Sử dụng Buffer giống code demo VNPay (mặc dù deprecated nhưng VNPay dùng cách này)
   */
  private createSecureHash(queryString: string): string {
    const hmac = crypto.createHmac('sha512', this.config.hashSecret);
    // Sử dụng Buffer giống code demo VNPay
    const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');
    return signed;
  }

  /**
   * Sắp xếp object theo thứ tự alphabet
   * Giống code demo VNPay: encode key và value, sort theo encoded key, replace %20 thành +
   * Code demo: vnpay_nodejs/vnpay_nodejs/routes/order.js:304
   */
  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const str: string[] = [];
    
    // Encode tất cả keys và lưu vào array để sort (giống code demo)
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    
    // Sort theo encoded key
    str.sort();
    
    // Tạo object mới với encoded key và encoded value (replace %20 thành +)
    // Lưu ý: obj[str[i]] hoạt động vì các key VNPay không có ký tự đặc biệt
    // nên encodeURIComponent(key) = key (giống code demo)
    for (let i = 0; i < str.length; i++) {
      const encodedKey = str[i];
      // Trong code demo, họ dùng obj[str[i]] trực tiếp
      // Vì các key VNPay không có ký tự đặc biệt nên encoded key = original key
      const originalKey = decodeURIComponent(encodedKey);
      const encodedValue = encodeURIComponent(obj[originalKey]).replace(/%20/g, '+');
      sorted[encodedKey] = encodedValue;
    }
    
    return sorted;
  }


  /**
   * Clean order description - loại bỏ ký tự đặc biệt có thể gây lỗi
   */
  private cleanOrderDescription(description: string): string {
    // Giới hạn độ dài (max 255 ký tự theo VNPay)
    let cleaned = description.substring(0, 255);
    
    // Loại bỏ các ký tự đặc biệt nguy hiểm
    cleaned = cleaned.replace(/[<>"']/g, '');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Format date theo định dạng VNPay (yyyyMMddHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Kiểm tra response code
   */
  getResponseMessage(responseCode: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định. Xin vui lòng thực hiện lại giao dịch.',
      '99': 'Lỗi không xác định',
      '03': 'Dữ liệu không hợp lệ (Invalid data format)',
    };

    return messages[responseCode] || 'Lỗi không xác định';
  }
}

/**
 * Tạo VNPay client instance
 */
export function createVNPayClient(): VNPayClient {
  const config: VNPayConfig = {
    tmnCode: process.env.VNPAY_TMN_CODE || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/vnpay/callback',
  };

  if (!config.tmnCode || !config.hashSecret) {
    throw new Error('VNPay configuration is missing. Please set VNPAY_TMN_CODE and VNPAY_HASH_SECRET in .env');
  }

  // Validate returnUrl format
  try {
    new URL(config.returnUrl);
  } catch (error) {
    throw new Error(`Invalid VNPAY_RETURN_URL format: ${config.returnUrl}. Must be a full URL (e.g., http://localhost:3000/api/payments/vnpay/callback)`);
  }

  return new VNPayClient(config);
}

