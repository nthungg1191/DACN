export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Chính sách vận chuyển
          </h1>
          <p className="text-gray-600 mb-8">
            Thông tin dưới đây giúp bạn hiểu rõ hơn về thời gian và phí giao hàng tại Fashion
            Ecommerce.
          </p>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Khu vực áp dụng</h2>
            <p className="text-gray-700 text-sm md:text-base">
              Chúng tôi hiện giao hàng trên toàn quốc thông qua các đơn vị vận chuyển uy tín
              (Giao Hàng Nhanh, Viettel Post, J&T...). Một số khu vực đảo xa có thể mất thêm thời
              gian vận chuyển.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Thời gian giao hàng</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm md:text-base">
              <li>Hà Nội & TP.HCM: khoảng 1–2 ngày làm việc.</li>
              <li>Các tỉnh/thành khác: khoảng 2–5 ngày làm việc.</li>
              <li>
                Thời gian có thể thay đổi nhẹ trong mùa cao điểm (Sale lớn, Lễ Tết...) hoặc do
                điều kiện thời tiết.
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Phí vận chuyển</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm md:text-base">
              <li>Đơn hàng từ 499.000đ: <strong>Miễn phí vận chuyển</strong> toàn quốc.</li>
              <li>Đơn dưới 499.000đ: phí giao động từ 25.000–35.000đ tùy khu vực.</li>
              <li>Phí vận chuyển chính xác sẽ hiển thị ở bước Thanh toán.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Giao hàng thất bại</h2>
            <p className="text-gray-700 text-sm md:text-base">
              Nếu đơn vị vận chuyển giao hàng không thành công (không liên lạc được, sai địa chỉ…),
              đơn hàng có thể được hoàn về kho. Chúng tôi sẽ liên hệ lại với bạn để xác nhận giao
              lại hoặc huỷ đơn theo thoả thuận.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Liên hệ hỗ trợ</h2>
            <p className="text-gray-700 text-sm md:text-base">
              Nếu bạn cần thay đổi địa chỉ nhận hàng, thời gian giao hoặc có vấn đề với quá trình
              vận chuyển, vui lòng liên hệ bộ phận CSKH qua trang{' '}
              <span className="font-semibold">Liên hệ</span> để được hỗ trợ nhanh nhất.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


