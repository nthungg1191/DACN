import Link from 'next/link';
import { FOOTER_LINKS, SITE_NAME } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">{SITE_NAME}</h3>
            <p className="text-sm text-gray-600">
              Thời trang hiện đại, phong cách trẻ trung. Chúng tôi mang đến cho
              bạn những sản phẩm chất lượng cao với giá cả hợp lý.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Công ty</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Hỗ trợ</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Theo dõi chúng tôi</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>
            © {currentYear} {SITE_NAME}. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}

