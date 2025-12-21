export const SITE_NAME = 'Fashion E-commerce';
export const SITE_DESCRIPTION = 'Thời trang hiện đại, phong cách trẻ trung';

export const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/blog', label: 'Blog thời trang' },
  { href: '/about', label: 'Về chúng tôi' },
  { href: '/contact', label: 'Liên hệ' },
];

export const FOOTER_LINKS = {
  company: [
    { href: '/about', label: 'Về chúng tôi' },
    { href: '/contact', label: 'Liên hệ' },
    { href: '/careers', label: 'Tuyển dụng' },
  ],
  support: [
    { href: '/faq', label: 'Câu hỏi thường gặp' },
    { href: '/shipping', label: 'Vận chuyển' },
    { href: '/returns', label: 'Đổi trả' },
    { href: '/privacy', label: 'Chính sách bảo mật' },
  ],
  social: [
    { href: 'https://www.facebook.com/ngoc.anh.58368', label: 'Facebook' },
    { href: 'https://www.instagram.com/anhcuteee48/', label: 'Instagram' },
    { href: 'https://twitter.com', label: 'Twitter' },
  ],
};

export const ORDER_STATUSES = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đã gửi hàng',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
} as const;

