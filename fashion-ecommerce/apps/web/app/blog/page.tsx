export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          {/* Meta */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              Blog thời trang · Hướng dẫn
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Capsule wardrobe cho người bận rộn: 10 món đồ mix được cả tháng
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Đăng ngày 16/12/2025 · 8 phút đọc
            </p>
          </div>

          {/* Intro */}
          <section className="mb-8 text-gray-700 leading-relaxed space-y-3">
            <p>
              Bạn mở tủ ra lúc nào cũng thấy đầy quần áo nhưng vẫn than “không có gì để mặc”?
              Đó là lúc bạn nên nghĩ tới{' '}
              <span className="font-semibold">capsule wardrobe</span> – một tủ đồ tinh gọn,
              ít món nhưng phối được rất nhiều outfit khác nhau.
            </p>
            <p>
              Bài viết này tổng hợp lại <span className="font-semibold">10 món đồ cơ bản</span>{' '}
              phù hợp với thời tiết và phong cách người Việt, cùng gợi ý cách phối để bạn có thể
              mặc đẹp cả tháng mà không cần suy nghĩ quá nhiều.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-8 space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              1. Nguyên tắc xây capsule wardrobe
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Trước khi mua thêm đồ, bạn nên nắm 3 nguyên tắc đơn giản:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <span className="font-semibold">Bảng màu giới hạn:</span> chọn 2–3 màu trung tính
                (đen, trắng, be, xám) và 1–2 màu nhấn bạn thích.
              </li>
              <li>
                <span className="font-semibold">Form cơ bản, dễ phối:</span> ưu tiên dáng suông,
                straight, slim vừa phải; tránh chi tiết quá cá tính khó kết hợp.
              </li>
              <li>
                <span className="font-semibold">Chất liệu bền, ít nhăn:</span> cotton, linen pha,
                denim, wool pha… giúp giữ form tốt và dùng lâu dài.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-8 space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              2. Danh sách 10 món đồ “must-have”
            </h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Áo sơ mi trắng basic.</li>
              <li>T‑shirt trơn (trắng/đen/be).</li>
              <li>Quần jean ống suông/ống đứng màu xanh đậm.</li>
              <li>Quần tây đen hoặc xám đậm.</li>
              <li>Blazer màu trung tính (be, xám hoặc đen).</li>
              <li>Áo len mỏng cổ tròn/cổ lọ.</li>
              <li>Váy midi trơn (cho nữ) hoặc áo polo (cho nam).</li>
              <li>Áo khoác nhẹ: trench coat hoặc jacket denim.</li>
              <li>Giày sneaker trắng đơn giản.</li>
              <li>Giày da/boots cổ thấp màu nâu hoặc đen.</li>
            </ol>
            <p className="text-sm text-gray-500">
              Với 10 món trên, bạn có thể xoay vòng được hàng chục set đồ khác nhau cho đi làm,
              đi chơi và cả những dịp semi‑formal.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8 space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              3. Gợi ý vài công thức phối đồ dễ áp dụng
            </h2>
            <div className="space-y-2 text-gray-700 leading-relaxed">
              <p>
                <span className="font-semibold">Đi làm:</span> Sơ mi trắng + quần tây đen +
                blazer + giày da → nhìn chuyên nghiệp mà vẫn thoải mái.
              </p>
              <p>
                <span className="font-semibold">Đi chơi cuối tuần:</span> T‑shirt trắng + jean
                ống suông + sneaker trắng + áo khoác denim.
              </p>
              <p>
                <span className="font-semibold">Trời se lạnh:</span> Áo len mỏng + trench coat +
                jean + boots cổ thấp, thêm khăn choàng nếu cần.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-8 space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              4. Mẹo mua sắm thông minh
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Ưu tiên chất lượng hơn số lượng – ít nhưng “xịn” sẽ dùng được lâu hơn.</li>
              <li>Thử phối ít nhất 3 outfit trong đầu trước khi quyết định mua 1 món.</li>
              <li>Giữ lại hoá đơn và tag để dễ đổi trả nếu mặc không hợp.</li>
            </ul>
          </section>

          {/* Outro */}
          <section className="border-t border-gray-100 pt-6 mt-4 text-gray-700 leading-relaxed">
            <p>
              Bạn không cần phải thay toàn bộ tủ đồ trong một lần. Hãy bắt đầu từ việc{' '}
              mua ít lại, chọn kỹ hơn, và ưu tiên những món có thể phối được nhiều cách.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Trong tương lai, chúng tôi sẽ tiếp tục cập nhật các bài viết về cách phối đồ cho từng
              dáng người, môi trường làm việc và ngân sách khác nhau để bạn dễ áp dụng hơn.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

