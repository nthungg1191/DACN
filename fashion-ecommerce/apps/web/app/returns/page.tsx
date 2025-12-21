export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Chính sách đổi trả
          </h1>
          <p className="text-gray-600 mb-8">
            Chúng tôi luôn mong muốn bạn hài lòng với sản phẩm đã mua. Nếu sản phẩm không phù hợp,
            bạn có thể tham khảo quy định đổi trả dưới đây.
          </p>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Thời hạn đổi trả</h2>
            <p className="text-gray-700 text-sm md:text-base">
              Bạn có thể yêu cầu đổi hoặc trả hàng trong vòng <strong>7–30 ngày</strong> kể từ khi
              nhận được sản phẩm, tuỳ theo chương trình và loại sản phẩm. Thời hạn cụ thể sẽ được
              ghi trong phần mô tả sản phẩm hoặc email xác nhận đơn hàng.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              2. Điều kiện sản phẩm được đổi trả
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm md:text-base">
              <li>Sản phẩm còn nguyên tem, mác, hộp, phụ kiện đi kèm (nếu có).</li>
              <li>Chưa qua sử dụng, chưa giặt tẩy, không bám bẩn hoặc hư hại do người dùng.</li>
              <li>Có hoá đơn mua hàng hoặc thông tin đơn hàng điện tử.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Sản phẩm không áp dụng</h2>
            <p className="text-gray-700 text-sm md:text-base">
              Một số sản phẩm không hỗ trợ đổi trả vì lý do vệ sinh hoặc theo quy định của nhà sản
              xuất, bao gồm nhưng không giới hạn:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm md:text-base mt-1">
              <li>Đồ lót, đồ bơi, vớ/tất.</li>
              <li>Sản phẩm giảm giá sâu theo chương trình "Xả kho" (nếu có ghi chú).</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              4. Quy trình đăng ký đổi trả
            </h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-1 text-sm md:text-base">
              <li>Liên hệ CSKH qua trang Liên hệ, hotline hoặc email hỗ trợ.</li>
              <li>Cung cấp mã đơn hàng, hình ảnh sản phẩm và lý do đổi trả.</li>
              <li>
                Sau khi được xác nhận, bạn đóng gói lại sản phẩm và gửi về địa chỉ kho theo hướng
                dẫn.
              </li>
              <li>
                Chúng tôi sẽ tiến hành gửi sản phẩm mới hoặc hoàn tiền theo thoả thuận sau khi kiểm
                tra hàng.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              5. Phí vận chuyển khi đổi trả
            </h2>
            <p className="text-gray-700 text-sm md:text-base">
              Với trường hợp lỗi do nhà sản xuất hoặc giao nhầm, chúng tôi sẽ chịu toàn bộ chi phí
              vận chuyển hai chiều. Trường hợp đổi do lý do cá nhân (không vừa size, đổi màu, đổi
              mẫu...), bạn có thể cần hỗ trợ một phần phí vận chuyển theo chính sách từng thời
              điểm.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


