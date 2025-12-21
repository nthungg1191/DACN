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

 Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd fashion-ecommerce
```

2. Copy file môi trường:
```bash
cp env.example .env
```

3. Chỉnh sửa `.env` với thông tin cấu hình của bạn:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fashion_ecommerce?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Khởi động Docker services:
```bash
npm run docker:up
```

5. Cài đặt dependencies:
```bash
npm install
```

6. Generate Prisma client:
```bash
npm run db:generate
```

7. Chạy database migrations:
```bash
npm run db:migrate
```

8. Seed database với dữ liệu mẫu:
```bash
npm run db:seed
```

9. Khởi động development server:
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

 💻 Phát triển

 Accounts mẫu

Sau khi seed database, bạn có thể đăng nhập với các tài khoản sau:

Admin:
- Email: `admin@fashion.com`
- Password: `admin123`

Customer:
- Email: `customer@example.com`
- Password: `customer123`

 Workspace Structure

Dự án sử dụng npm workspaces để quản lý monorepo:

- `apps/web` - Frontend Next.js application
- `packages/database` - Shared database package
- `packages/types` - Shared TypeScript types
- `packages/ui` - Shared UI components

 Adding Dependencies

Thêm dependency vào root:
```bash
npm install <package> -w <workspace-name>
```

Ví dụ:
```bash
npm install axios -w web
```

 📜 Scripts

 Root level scripts

```bash
npm run dev           Chạy tất cả apps trong dev mode
npm run build         Build tất cả apps
npm run lint          Lint tất cả packages
npm run clean         Clean build artifacts
npm run format        Format code với Prettier
```

 Database scripts

```bash
npm run db:generate   Generate Prisma client
npm run db:migrate    Chạy database migrations
npm run db:push       Push schema changes (dev only)
npm run db:seed       Seed database với dữ liệu mẫu
npm run db:studio     Mở Prisma Studio
```

 Docker scripts

```bash
npm run docker:up     Khởi động Docker services
npm run docker:down   Dừng Docker services
npm run docker:logs   Xem Docker logs
```

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

 Prisma Studio

Để xem và quản lý database qua UI:

```bash
npm run db:studio
```

Truy cập `http://localhost:5555`

 🧪 Testing

Xem tài liệu chi tiết về môi trường kiểm thử: [TESTING_ENVIRONMENT.md](./TESTING_ENVIRONMENT.md)

**Tóm tắt công cụ kiểm thử:**

- **Quản lý kiểm thử**: Jira / GitHub Projects
- **Theo dõi lỗi**: Sentry, GitHub Issues
- **CI/CD**: GitHub Actions, Vercel
- **Kiểm thử hiệu năng**: Lighthouse CI, k6, WebPageTest
- **Kiểm thử bảo mật**: OWASP ZAP, Snyk, npm audit
- **Kiểm thử đa trình duyệt**: Playwright, BrowserStack
- **Kiểm thử khả năng truy cập**: axe DevTools, WAVE, Lighthouse
- **Môi trường triển khai**: Development, Staging, Production
- **Dữ liệu kiểm thử**: Seed data, Mock data, Test fixtures

 💳 Payment Integration

Xem tài liệu chi tiết về tích hợp thanh toán: [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md)

**Giải pháp thanh toán được đề xuất:**

- **VNPay** (Ưu tiên chính): Hỗ trợ 40+ ngân hàng Việt Nam, phí 0.5-1.5%
- **Stripe**: Hỗ trợ thanh toán quốc tế, phí 3.4% + 3,000 VND
- **MoMo** (Tùy chọn): Ví điện tử phổ biến tại Việt Nam

 📝 Tuần 1 - Hoàn thành

 ✅ Đã hoàn thành

1. Monorepo Setup
   - ✅ Cấu hình Turborepo
   - ✅ Workspace structure
   - ✅ Shared packages

2. Infrastructure
   - ✅ Docker Compose với PostgreSQL & Redis
   - ✅ Environment configuration

3. Database
   - ✅ Prisma schema design
   - ✅ Database models
   - ✅ Seed data

4. Packages
   - ✅ Database package với Prisma
   - ✅ Types package
   - ✅ UI components package

5. Frontend Application
   - ✅ Next.js 14 setup với App Router
   - ✅ Tailwind CSS configuration
   - ✅ NextAuth.js integration
   - ✅ Layout components (Header, Footer)
   - ✅ Homepage với basic UI

6. Authentication
   - ✅ NextAuth configuration
   - ✅ Credentials provider
   - ✅ Registration API
   - ✅ JWT session handling

 🔜 Kế hoạch tiếp theo

 Tuần 2
- [ ] Product listing page
- [ ] Product detail page
- [ ] Category filtering
- [ ] Search functionality
- [ ] Shopping cart implementation

 Tuần 3
- [ ] Checkout flow
- [ ] Payment integration
- [ ] Order management
- [ ] User profile pages
- [ ] Admin dashboard

 📄 License

MIT License

 👥 Contributors

- Nhóm phát triển DoAnCN2

