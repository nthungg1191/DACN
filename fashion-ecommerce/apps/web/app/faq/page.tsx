const faqs = [
  {
    question: 'Làm thế nào để theo dõi đơn hàng của tôi?',
    answer:
      'Bạn có thể vào mục "Đơn hàng của tôi" trong trang Tài khoản sau khi đăng nhập. Tại đó sẽ hiển thị trạng thái đơn hàng, mã vận đơn và lịch sử cập nhật.',
  },
  {
    question: 'Tôi có thể đổi trả sản phẩm trong bao lâu?',
    answer:
      'Bạn có thể yêu cầu đổi trả trong vòng 7–30 ngày tuỳ chính sách từng sản phẩm (thông tin cụ thể được ghi trên trang chi tiết sản phẩm và trong email xác nhận đơn hàng).',
  },
  {
    question: 'Những sản phẩm nào không được đổi trả?',
    answer:
      'Các sản phẩm đã qua sử dụng, không còn tag/mác, bị bẩn/hư hại do người dùng hoặc thuộc danh mục đồ lót, đồ bơi, phụ kiện nhạy cảm thường không áp dụng đổi trả.',
  },
  {
    question: 'Tôi cần làm gì nếu nhận hàng bị lỗi hoặc giao sai?',
    answer:
      'Vui lòng chụp lại hình ảnh sản phẩm, mã đơn hàng và liên hệ ngay qua mục Liên hệ hoặc email hỗ trợ; chúng tôi sẽ hỗ trợ đổi mới hoặc hoàn tiền tuỳ trường hợp.',
  },
  {
    question: 'Shop có hỗ trợ xuất hoá đơn VAT không?',
    answer:
      'Có, bạn có thể để lại thông tin công ty trong ghi chú đơn hàng hoặc liên hệ bộ phận CSKH để được hỗ trợ xuất hoá đơn VAT.',
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Câu hỏi thường gặp
            </h1>
            <p className="text-gray-600">
              Tổng hợp những thắc mắc phổ biến về đặt hàng, thanh toán và đổi trả.
            </p>
          </header>

          <div className="space-y-4">
            {faqs.map((item, idx) => (
              <details
                key={idx}
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-5"
              >
                <summary className="cursor-pointer text-sm md:text-base font-semibold text-gray-900">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm md:text-base text-gray-700 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


