export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Chính sách bảo mật
          </h1>
          <p className="text-gray-600 mb-8">
            Chúng tôi cam kết bảo vệ thông tin cá nhân của khách hàng và chỉ sử dụng cho mục đích
            phục vụ trải nghiệm mua sắm của bạn tại Fashion Ecommerce.
          </p>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              1. Thông tin chúng tôi thu thập
            </h2>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1">
              <li>Thông tin tài khoản: họ tên, email, số điện thoại, mật khẩu (được mã hoá).</li>
              <li>Thông tin giao hàng: địa chỉ nhận hàng, người nhận, số điện thoại liên hệ.</li>
              <li>Thông tin đơn hàng: sản phẩm, giá trị đơn, hình thức thanh toán.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              2. Mục đích sử dụng thông tin
            </h2>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1">
              <li>Xử lý đơn hàng và giao hàng đến đúng địa chỉ.</li>
              <li>Liên hệ khi cần xác nhận, hỗ trợ hoặc giải quyết khiếu nại.</li>
              <li>
                Gửi thông tin khuyến mãi, chăm sóc khách hàng (chỉ khi bạn đồng ý nhận thông tin).
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              3. Chia sẻ thông tin với bên thứ ba
            </h2>
            <p className="text-gray-700 text-sm md:text-base">
              Chúng tôi chỉ chia sẻ thông tin khi thực sự cần thiết cho việc cung cấp dịch vụ, ví
              dụ:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1 mt-1">
              <li>Đơn vị vận chuyển để giao hàng.</li>
              <li>Đối tác thanh toán (cổng thanh toán, ngân hàng) khi bạn thực hiện thanh toán.</li>
            </ul>
            <p className="text-gray-700 text-sm md:text-base mt-2">
              Chúng tôi <strong>không bán</strong> hoặc trao đổi dữ liệu cá nhân của bạn cho bên
              thứ ba vì mục đích thương mại độc lập.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              4. Quyền của khách hàng đối với dữ liệu cá nhân
            </h2>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1">
              <li>Xem, chỉnh sửa thông tin tài khoản và địa chỉ giao hàng.</li>
              <li>Yêu cầu xoá tài khoản khi không còn sử dụng dịch vụ.</li>
              <li>Huỷ đăng ký nhận email marketing bất cứ lúc nào.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              5. Liên hệ về vấn đề bảo mật
            </h2>
            <p className="text-gray-700 text-sm md:text-base">
              Nếu bạn có câu hỏi hoặc yêu cầu liên quan đến bảo mật thông tin, vui lòng liên hệ qua
              trang Liên hệ hoặc email hỗ trợ của chúng tôi. Chúng tôi sẽ phản hồi trong thời gian
              sớm nhất.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


