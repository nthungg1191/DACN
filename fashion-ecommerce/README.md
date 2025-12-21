 Fashion E-commerce Platform

Nền tảng thương mại điện tử thời trang được xây dựng với Turborepo, Next.js, Prisma và PostgreSQL.

 📋 Mục lục

- [Tổng quan](tổng-quan)
- [Cấu trúc dự án](cấu-trúc-dự-án)
- [Công nghệ sử dụng](công-nghệ-sử-dụng)
- [Bắt đầu](bắt-đầu)
- [Phát triển](phát-triển)
- [Scripts](scripts)
- [Database](database)
- [Testing](testing)
- [Payment Integration](payment-integration)

 📖 Tổng quan

Fashion E-commerce Platform là một hệ thống thương mại điện tử hiện đại được thiết kế đặc biệt cho ngành thời trang. Dự án cung cấp trải nghiệm mua sắm mượt mà với các tính năng tiên tiến như tìm kiếm thông minh, cá nhân hóa sản phẩm, và quản lý đa kênh.

 🎯 Mục tiêu dự án

- Trải nghiệm người dùng: Giao diện thân thiện, responsive trên mọi thiết bị
- Hiệu suất cao: Tối ưu tốc độ tải trang và khả năng mở rộng
- Bảo mật: Tuân thủ các chuẩn bảo mật quốc tế (PCI DSS, GDPR)
- Tích hợp: Hỗ trợ đa phương thức thanh toán và vận chuyển

 ✨ Features

 👥 Khách hàng
- 🔐 Authentication: Đăng ký/đăng nhập với xác thực email/SMS
- 🔍 Tìm kiếm thông minh: Tìm kiếm sản phẩm với gợi ý và autocomplete
- 🛒 Giỏ hàng: Quản lý sản phẩm trong giỏ hàng với tính năng lưu trữ
- 💳 Thanh toán: Hỗ trợ đa phương thức thanh toán (Stripe, VNPay, MoMo)
- 📱 Responsive: Tối ưu cho mobile-first với PWA support
- ⭐ Đánh giá: Hệ thống rating và review sản phẩm
- ❤️ Wishlist: Lưu trữ sản phẩm yêu thích
- 📦 Theo dõi đơn hàng: Tracking real-time với email notifications

 👨‍💼 Quản trị
- 📊 Dashboard: Báo cáo doanh thu và analytics chi tiết
- 🏷️ Quản lý sản phẩm: CRUD với variants (size, color, price)
- 📦 Quản lý đơn hàng: Xử lý đơn hàng với workflow tự động
- 👥 Quản lý khách hàng: Phân khúc và targeting marketing
- 🎫 Khuyến mãi: Hệ thống coupon và discount codes
- 📈 Analytics: Báo cáo chi tiết về sales, inventory, customer behavior

 🤖 Tính năng nâng cao
- 🧠 AI Recommendations: Gợi ý sản phẩm cá nhân hóa
- 🔍 Visual Search: Tìm kiếm bằng hình ảnh
- 📊 Size Recommendation: Gợi ý size phù hợp
- 💬 Chatbot: Hỗ trợ khách hàng 24/7
- 🎨 AR Try-on: Thử đồ ảo (Roadmap)

 📁 Cấu trúc dự án

```
fashion-ecommerce/
├── apps/
│   └── web/                  Next.js frontend application
│       ├── app/             App router pages
│       ├── components/      React components
│       └── lib/             Utility functions
├── packages/
│   ├── database/            Prisma database package
│   │   ├── schema.prisma    Database schema
│   │   ├── client.ts        Prisma client
│   │   └── seed.ts          Database seeding
│   ├── types/               Shared TypeScript types
│   └── ui/                  Shared UI components
│       └── src/             Component source files
├── docker-compose.yml       Docker services configuration
├── turbo.json              Turborepo configuration
└── package.json            Root package configuration
```

 🛠️ Công nghệ sử dụng

 Frontend
- Next.js 14 - React framework với App Router
- React 18 - UI library
- TypeScript - Type safety
- Tailwind CSS - Utility-first CSS framework
- NextAuth.js - Authentication

 Backend & Database
- Prisma - Modern ORM
- PostgreSQL - Relational database
- Redis - Caching layer

 Development Tools
- Turborepo - Monorepo build system
- ESLint - Code linting
- Prettier - Code formatting

 📋 Yêu cầu hệ thống

| Thành phần | Cấu hình |
| :--------- | :------- |
| **Hệ điều hành** | Windows / Linux / macOS |
| **Trình duyệt** | Chrome, Edge, Safari, Firefox |
| **Cơ sở dữ liệu** | PostgreSQL 15+ |
| **Server** | Next.js / Node.js 18+ |
| **Thiết bị** | PC, tablet, mobile (UI responsive) |

 🚀 Bắt đầu

 Yêu cầu

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose

 🗄️ Database

 Schema Overview

Database schema bao gồm các models chính:

- User - Thông tin người dùng và authentication
- Account - OAuth accounts (NextAuth)
- Session - User sessions
- Product - Thông tin sản phẩm
- Category - Danh mục sản phẩm
- ProductVariant - Biến thể sản phẩm (size, màu sắc)
- Cart/CartItem - Giỏ hàng
- Wishlist - Danh sách yêu thích
- Order/OrderItem - Đơn hàng
- Review - Đánh giá sản phẩm
- Address - Địa chỉ giao hàng




