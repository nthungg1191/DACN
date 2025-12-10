/**
 * Chính sách và quy định của cửa hàng
 * Dùng cho RAG context trong chatbot
 */

export const storePolicies = {
  shipping: {
    title: 'Chính sách vận chuyển',
    content: `
- Miễn phí vận chuyển cho đơn hàng từ 500.000đ trở lên
- Phí vận chuyển: 30.000đ cho đơn hàng dưới 500.000đ
- Thời gian giao hàng: 2-5 ngày làm việc (tùy khu vực)
- Hỗ trợ giao hàng toàn quốc
- Đơn hàng sẽ được giao trong giờ hành chính (8:00 - 18:00)
- Khách hàng có thể theo dõi đơn hàng qua email/SMS
    `.trim(),
  },
  return: {
    title: 'Chính sách đổi trả',
    content: `
- Thời gian đổi trả: 7 ngày kể từ ngày nhận hàng
- Điều kiện đổi trả:
  + Sản phẩm còn nguyên tem, nhãn mác
  + Chưa qua sử dụng, giặt tẩy
  + Còn đầy đủ phụ kiện, bao bì gốc
  + Có hóa đơn mua hàng
- Không áp dụng đổi trả cho:
  + Đồ lót, đồ bơi
  + Sản phẩm đã giảm giá trên 50%
  + Sản phẩm đã được tùy chỉnh theo yêu cầu
- Phí đổi trả: Khách hàng chịu phí vận chuyển (nếu không phải lỗi của cửa hàng)
- Thời gian xử lý: 3-5 ngày làm việc sau khi nhận được hàng
    `.trim(),
  },
  payment: {
    title: 'Phương thức thanh toán',
    content: `
- Thanh toán khi nhận hàng (COD)
- Chuyển khoản ngân hàng (VNPay, SePay)
- Thẻ tín dụng/ghi nợ (VNPay)
- Ví điện tử (SePay)
- Thời gian xử lý thanh toán: Ngay sau khi đặt hàng
- Đơn hàng sẽ được xử lý sau khi thanh toán thành công
    `.trim(),
  },
  warranty: {
    title: 'Chính sách bảo hành',
    content: `
- Bảo hành 1 tháng cho lỗi sản xuất
- Bảo hành không bao gồm: hư hỏng do sử dụng sai cách, tự ý sửa chữa
- Quy trình bảo hành: Liên hệ hotline/email → Gửi ảnh sản phẩm → Xác nhận → Gửi hàng về cửa hàng → Xử lý trong 5-7 ngày
    `.trim(),
  },
  privacy: {
    title: 'Chính sách bảo mật',
    content: `
- Thông tin khách hàng được bảo mật tuyệt đối
- Không chia sẻ thông tin cho bên thứ ba
- Sử dụng SSL để mã hóa dữ liệu
- Khách hàng có quyền yêu cầu xóa thông tin cá nhân
    `.trim(),
  },
  general: {
    title: 'Thông tin chung',
    content: `
- Cửa hàng chuyên bán quần áo thời trang nam, nữ
- Cam kết chất lượng sản phẩm chính hãng
- Hỗ trợ khách hàng 24/7 qua hotline và chat
- Địa chỉ: [Cập nhật địa chỉ cửa hàng]
- Hotline: [Cập nhật số hotline]
- Email: [Cập nhật email]
    `.trim(),
  },
  userPermissions: {
    title: 'Quyền hạn của người dùng',
    content: `
## Khách hàng (CUSTOMER) có thể:

### Xem và mua sắm:
- Xem danh sách sản phẩm, tìm kiếm sản phẩm
- Xem chi tiết sản phẩm, đánh giá và bình luận
- Thêm sản phẩm vào giỏ hàng
- Thêm/xóa sản phẩm khỏi danh sách yêu thích (wishlist)

### Quản lý tài khoản:
- Đăng ký tài khoản mới
- Đăng nhập/đăng xuất
- Xem và cập nhật thông tin cá nhân (tên, email, avatar)
- Thay đổi mật khẩu

### Đặt hàng và thanh toán:
- Tạo đơn hàng từ giỏ hàng
- Chọn phương thức thanh toán (COD, VNPay, SePay)
- Xem danh sách đơn hàng của mình
- Xem chi tiết đơn hàng (trạng thái, sản phẩm, giá)
- Hủy đơn hàng (nếu chưa thanh toán)
- Thử lại thanh toán nếu thanh toán thất bại

### Đánh giá sản phẩm:
- Đánh giá và bình luận sản phẩm (sau khi đã nhận hàng - status DELIVERED)
- Xem đánh giá của khách hàng khác

### Quản lý địa chỉ:
- Thêm địa chỉ giao hàng
- Sửa/xóa địa chỉ giao hàng
- Đặt địa chỉ mặc định

### Liên hệ và hỗ trợ:
- Sử dụng chatbot để được tư vấn
- Xem thông tin liên hệ của cửa hàng

## Quản trị viên (ADMIN) có thể:
- Tất cả quyền của CUSTOMER
- Quản lý sản phẩm (thêm/sửa/xóa)
- Quản lý danh mục sản phẩm
- Quản lý đơn hàng (xem tất cả đơn hàng của mọi khách hàng)
- Quản lý người dùng

## Lưu ý:
- Một số chức năng yêu cầu đăng nhập (giỏ hàng, đặt hàng, xem đơn hàng)
- Khách hàng chỉ có thể xem và quản lý đơn hàng của chính mình
- Để đánh giá sản phẩm, khách hàng phải đã mua và nhận được sản phẩm (đơn hàng ở trạng thái DELIVERED)
    `.trim(),
  },
};

/**
 * Format policies thành text để inject vào prompt
 */
export function formatPoliciesForRAG(): string {
  const sections = Object.values(storePolicies)
    .map((policy) => `## ${policy.title}\n${policy.content}`)
    .join('\n\n');

  return `# CHÍNH SÁCH VÀ QUY ĐỊNH CỬA HÀNG\n\n${sections}`;
}

