# 🚀 Hướng dẫn Setup Fashion E-commerce

Hướng dẫn chi tiết từng bước để khởi động dự án Fashion E-commerce.

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- ✅ **Node.js** phiên bản >= 18.0.0 ([Tải về](https://nodejs.org/))
- ✅ **npm** phiên bản >= 9.0.0 (đi kèm với Node.js)
- ✅ **Docker Desktop** ([Tải về](https://www.docker.com/products/docker-desktop/))
- ✅ **Git** ([Tải về](https://git-scm.com/))

Kiểm tra phiên bản đã cài:
```bash
node --version    # Nên >= v18.0.0
npm --version     # Nên >= 9.0.0
docker --version  # Kiểm tra Docker đã cài
```

## 📥 Bước 1: Clone Repository

```bash
# Clone repository về máy
git clone <repository-url>

# Di chuyển vào thư mục dự án
cd DoAnCN2/fashion-ecommerce
```

## ⚙️ Bước 2: Cấu hình môi trường

1. Copy file môi trường mẫu:
```bash
# Windows (PowerShell)
Copy-Item env.example .env

# macOS/Linux
cp env.example .env
```

2. Mở file `.env` và chỉnh sửa nếu cần (mặc định đã OK cho development):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fashion_ecommerce?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

**Lưu ý:** Bạn nên thay đổi `NEXTAUTH_SECRET` thành một chuỗi ngẫu nhiên an toàn hơn.

## 🐳 Bước 3: Khởi động Docker Services

```bash
# Khởi động PostgreSQL và Redis
npm run docker:up

# Đợi khoảng 10-15 giây để services khởi động hoàn toàn
```

Kiểm tra Docker đang chạy:
```bash
# Xem logs của Docker services
npm run docker:logs

# Hoặc kiểm tra trong Docker Desktop
```

Bạn sẽ thấy:
- ✅ `fashion-ecommerce-db` - PostgreSQL database
- ✅ `fashion-ecommerce-redis` - Redis cache

## 📦 Bước 4: Cài đặt Dependencies

```bash
# Cài đặt tất cả packages trong monorepo
npm install
```

Quá trình này sẽ cài đặt dependencies cho:
- Root workspace
- apps/web
- packages/database
- packages/types
- packages/ui

**Thời gian:** Khoảng 2-5 phút tùy tốc độ mạng.

## 🗄️ Bước 5: Setup Database

### 5.1 Generate Prisma Client

```bash
npm run db:generate
```

Lệnh này sẽ tạo Prisma Client từ schema.

### 5.2 Chạy Migrations

```bash
npm run db:migrate
```

Bạn sẽ được yêu cầu đặt tên cho migration, ví dụ: `init`

### 5.3 Seed Database

```bash
npm run db:seed
```

Lệnh này sẽ thêm dữ liệu mẫu vào database:
- ✅ 2 users (admin và customer)
- ✅ 3 categories (Nam, Nữ, Phụ kiện)
- ✅ 4 sản phẩm mẫu

## 🎉 Bước 6: Khởi động Development Server

```bash
npm run dev
```

Ứng dụng sẽ khởi động tại:
- 🌐 **Frontend:** http://localhost:3000

**Thời gian khởi động lần đầu:** 30-60 giây

## ✅ Kiểm tra Setup

### Mở trình duyệt và truy cập:

1. **Homepage:** http://localhost:3000
   - Bạn sẽ thấy trang chủ với header, footer và nội dung mẫu

2. **Prisma Studio:** (Optional - để xem database)
```bash
npm run db:studio
```
   - Mở http://localhost:5555 để xem và quản lý database

### Đăng nhập với tài khoản mẫu:

**Admin:**
- Email: `admin@fashion.com`
- Password: `admin123`

**Customer:**
- Email: `customer@example.com`
- Password: `customer123`

## 🛠️ Troubleshooting

### Lỗi: "Port 5432 already in use"
PostgreSQL đã chạy ở nơi khác. Giải pháp:
```bash
# Dừng Docker services
npm run docker:down

# Hoặc thay đổi port trong docker-compose.yml và .env
```

### Lỗi: "Cannot connect to database"
```bash
# Kiểm tra Docker containers đang chạy
docker ps

# Restart Docker services
npm run docker:down
npm run docker:up

# Đợi 10-15 giây và thử lại
```

### Lỗi: "Module not found"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install

# Hoặc trên Windows
Remove-Item -Recurse -Force node_modules
npm install
```

### Lỗi khi chạy db:migrate
```bash
# Reset database và chạy lại
npm run db:push
npm run db:seed
```

### Port 3000 đã được sử dụng
```bash
# Thay đổi port khi chạy
npm run dev -- -p 3001
```

## 🔄 Dừng và khởi động lại

### Dừng development server:
- Nhấn `Ctrl + C` trong terminal

### Dừng Docker services:
```bash
npm run docker:down
```

### Khởi động lại:
```bash
# Khởi động Docker
npm run docker:up

# Đợi 10 giây, sau đó khởi động dev server
npm run dev
```

## 📚 Commands Cheat Sheet

```bash
# Development
npm run dev              # Khởi động dev server
npm run build           # Build cho production
npm run start           # Chạy production build
npm run lint            # Kiểm tra code style

# Database
npm run db:generate     # Generate Prisma Client
npm run db:migrate      # Chạy migrations
npm run db:push         # Push schema (dev only)
npm run db:seed         # Seed dữ liệu mẫu
npm run db:studio       # Mở Prisma Studio

# Docker
npm run docker:up       # Khởi động services
npm run docker:down     # Dừng services
npm run docker:logs     # Xem logs

# Code Quality
npm run format          # Format code
npm run clean           # Clean build files
```

## 📖 Tài liệu thêm

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Turborepo Documentation](https://turbo.build/repo/docs)

## 🆘 Cần trợ giúp?

Nếu gặp vấn đề:
1. Kiểm tra [Troubleshooting](#troubleshooting) ở trên
2. Xem logs: `npm run docker:logs`
3. Đọc README.md để biết thêm chi tiết
4. Liên hệ team phát triển

---

**Chúc bạn code vui vẻ! 🚀**

