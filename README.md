# SWP391 — HRM System · Team 7

Hệ thống quản lý nhân sự (Human Resource Management). Dự án môn học SWP391, Học kỳ Summer 2026.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Runtime  | **Bun** (Trình chạy & quản lý package chính)    |
| Backend  | Express 5 + TypeScript + Prisma ORM             |
| Frontend | React 19 + Vite 8 + TypeScript + Tailwind CSS   |
| Database | PostgreSQL                                      |
| Auth     | JWT (access 15m) + httpOnly cookie (refresh 7d) |

---

## 📁 Cấu trúc thư mục (Project Structure)

```text
.
├── backend/            # Express REST API (TypeScript + Bun)
│   ├── src/
│   │   ├── configs/    # Centralized configurations (entities, auth, system, rules)
│   │   ├── controllers/# Request handlers (chỉ xử lý HTTP adapter)
│   │   ├── libs/       # Thư viện dùng chung (kết nối DB, Prisma client,...)
│   │   ├── middlewares/# Express Middlewares (CORS, Validate, Auth guard)
│   │   ├── repositories/# Data access layer (Nơi chạy query SQL/Prisma)
│   │   ├── routes/     # Định nghĩa APIs route
│   │   ├── services/   # Business logic layer (Xử lý nghiệp vụ chính)
│   │   ├── utils/      # Helpers & các class lỗi (AppError)
│   │   └── scripts/    # Các script độc lập (Seed, Clear DB, Hash password)
│   └── prisma/         # Prisma Schema & Migrations
├── frontend/           # React SPA (Vite + TypeScript)
│   └── src/
│       ├── components/ # UI Components / Primitives
│       ├── features/   # Feature-sliced modules
│       ├── pages/      # Route pages
│       └── App.tsx
└── docs/               # Tài liệu thiết kế hệ thống & Quy chuẩn coding
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống

- Yêu cầu cài đặt **[Bun](https://bun.sh)** (phiên bản `>= 1.0`).

### 2. Cài đặt Dependencies

Chạy lệnh sau tại thư mục **ROOT** để cài đặt thư viện cho toàn bộ dự án (cả Frontend và Backend):

```bash
bun run install:all
```

_(Lệnh này sử dụng `concurrently` để tự động chạy cài đặt song song ở cả 2 thư mục)._

### 3. Cấu hình biến môi trường (Environment Variables)

Tạo file `backend/.env` bằng cách sao chép từ file mẫu:

```bash
cp backend/.env.example backend/.env
```

Cấu hình các giá trị trong `backend/.env` phù hợp với database PostgreSQL của bạn:

```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/hrm_db?schema=public"
ACCESS_TOKEN_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_here
```

---

## 💻 Danh sách Lệnh CLI tại thư mục ROOT

Bạn có thể chạy toàn bộ các lệnh phát triển, tương tác DB trực tiếp từ thư mục **ROOT** mà không cần `cd` vào từng thư mục con.

### 1. Khởi chạy môi trường Phát triển (Development)

| Lệnh                   | Mô tả                                                                                                      |
| :--------------------- | :--------------------------------------------------------------------------------------------------------- |
| `bun run dev`          | Khởi chạy song song cả **Backend** (`:5000`) và **Frontend** (`:5173`)                                     |
| `bun run dev:all`      | **(Khuyên dùng)** Chạy đồng thời **Frontend** + **Backend** + **Prisma Studio** (GUI quản lý DB trực quan) |
| `bun run dev:backend`  | Chỉ chạy riêng Backend (có hot-reload tự động xem thay đổi code)                                           |
| `bun run dev:frontend` | Chỉ chạy riêng Frontend (Vite Dev Server)                                                                  |

> [!TIP]
> Sử dụng lệnh **`bun run dev:all`** để vừa lập trình vừa có sẵn giao diện quản trị cơ sở dữ liệu trực quan trên trình duyệt (mặc định tại `http://localhost:5555`).

---

### 2. Quản lý Cơ sở Dữ liệu (Database & Prisma)

| Lệnh                    | Mô tả                                                                        |
| :---------------------- | :--------------------------------------------------------------------------- |
| `bun run db:migrate`    | Tạo và chạy các file database migration mới dựa trên `schema.prisma`         |
| `bun run db:generate`   | Biên dịch tạo lại Prisma Client (cần chạy sau khi sửa đổi schema)            |
| `bun run db:studio`     | Khởi chạy Prisma Studio độc lập (Giao diện web để xem/sửa dữ liệu trực tiếp) |
| `bun run db:seed`       | Nạp dữ liệu mẫu cơ bản vào database                                          |
| `bun run db:seed:all`   | Nạp toàn bộ dữ liệu mẫu nâng cao                                             |
| `bun run db:seed:reset` | Xóa sạch toàn bộ bảng DB cũ và tiến hành seed lại từ đầu                     |
| `bun run db:clear`      | Xóa sạch hoàn toàn dữ liệu trong các bảng DB hiện tại                        |

---

### 3. Các lệnh bổ trợ khác (Helpers)

| Lệnh                    | Mô tả                                                  |
| :---------------------- | :----------------------------------------------------- |
| `bun run hash-password` | Tiện ích băm nhanh một mật khẩu (phục vụ test)         |
| `bun run seed-admin`    | Tạo nhanh tài khoản Administrator mặc định vào DB      |
| `bun run build`         | Build dự án Frontend phục vụ cho môi trường Production |

---

## 📑 Tài liệu Hướng dẫn chi tiết (Documentation Index)

Trước khi viết code mới hoặc thực hiện thay đổi, vui lòng đọc kỹ các tài liệu tiêu chuẩn thiết kế trong thư mục `docs/`:

- 📜 **[Quy chuẩn coding (Code Standards)](file:///docs/code-standards.md)**: Quy tắc đặt tên, cấu trúc file, standard abstractions.
- 📜 **[Nguyên lý SOLID (SOLID Principles)](file:///docs/solid-principles.md)**: Cách thiết kế class, layers lỏng lẻo & tái sử dụng.
- 📜 **[Mẫu thiết kế (Design Patterns)](file:///docs/design-patterns.md)**: Hướng dẫn áp dụng Repository, Service, Strategy, Factory patterns.
- 📜 **[Kiến trúc hệ thống (System Architecture)](file:///docs/system-architecture.md)**: Sơ đồ luồng xử lý Request/Response, Auth flow chi tiết.
- 📜 **[Hợp đồng Interface (Interface Contracts)](file:///docs/interface-contracts.md)**: Danh sách các API contracts, DTOs & envelopes chuẩn hóa.
