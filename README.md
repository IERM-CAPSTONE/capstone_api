# Face Authentication Capstone Project - Monorepo

Dự án Hệ thống Xác thực khuôn mặt (Face Authentication) - Capstone Project. Được xây dựng trên nền tảng **NestJS Monorepo** với kiến trúc hiện đại, tập trung vào hiệu năng và khả năng mở rộng.

## 🚀 Công nghệ sử dụng

- **Backend Framework**: [NestJS](https://nestjs.com/) (v10+)
- **Architecture**: Vertical Slice Architecture + Domain-Driven Design (DDD)
- **Database ORM**: [Prisma](https://www.prisma.io/) (Hỗ trợ Multi-file schema)
- **Messaging Queue**: [RabbitMQ](https://www.rabbitmq.com/) (Sử dụng cho xử lý tác vụ nền)
- **Authentication**: Passport.js (JWT Strategy, Google OAuth 2.0)
- **DevOps**: Docker Compose (RabbitMQ, PostgreSQL)

## 📁 Cấu trúc dự án (Monorepo)

Dự án được tổ chức theo mô hình **Monorepo**, cho phép quản lý công việc của cả API Server và Background Worker trong cùng một repository, chia sẻ các thư viện chung (libs).

### 1. Thư mục `apps/` (Các ứng dụng chính)

- **`app_api/`**:
  - Chứa mã nguồn của API Server chính.
  - Được tổ chức theo **Vertical Slice Architecture**.
  - Mỗi tính năng nằm trong `src/features/[feature_name]`.
- **`app_background/`**:
  - Chứa Background Worker (Consumer).
  - Tập trung vào các tác vụ tiêu tốn tài nguyên (AI, Face Recognition, Email).
  - Lắng nghe và xử lý các tin nhắn từ RabbitMQ.

### 2. Thư mục `libs/` (Thư viện dùng chung)

- **`prisma/`**:
  - Quản lý kết nối Database.
  - Cung cấp `PrismaService` dùng chung cho tất cả các apps.
- **`queue/`**:
  - Quản lý cấu hình và kết nối RabbitMQ.
  - Chứa các Constants, Interfaces và Module khởi tạo cho hệ thống Messaging.

### 3. Thư mục `prisma/` (Database Management)

- **`schema/`**: Chứa các file `.prisma` riêng lẻ (Module hóa Schema).
- **`migrations/`**: Lịch sử các bản cập nhật cấu trúc Database.
- **`prisma.config.ts`**: Cấu hình gộp các file schema lẻ thành một bộ schema nhất nhất.

### 4. Cấu trúc chi tiết một Feature (trong `app_api`)

```text
features/users/
├── domain/           # Chứa Entity, Value Objects, Repository Interface
├── infrastructure/   # Prisma Repository, JWT Strategy, External Services
├── use-cases/        # Các lát cắt tính năng (Create, Login, Profile...)
│   └── [use-case]/
│       ├── handler.ts    # Logic nghiệp vụ (Application Service)
│       ├── endpoint.ts   # Controller (API Route)
│       └── [dto.ts]      # Data Transfer Objects
├── shared/           # Response DTOs hoặc constants dùng chung trong feature
├── index.ts          # Thùng gom (Barrel file) để export các thành phần ra ngoài
└── users.module.ts   # Đăng ký providers & controllers của feature
```

## 🛠 Cài đặt & Setup

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Environment

Dự án sử dụng cơ chế nạp file `.env` theo môi trường:

- **Phát triển (Development)**: Sử dụng file `.env.development`.
- **Sản xuất (Production)**: Sử dụng file `.env.production`.

```bash
# Tạo file môi trường phát triển
cp .env.example .env.development

# Tạo file môi trường sản xuất
cp .env.example .env.production
```

*Lưu ý: Hệ thống sẽ tự động nạp file tương ứng dựa trên biến môi trường `NODE_ENV`. Nếu không đặt `NODE_ENV`, mặc định sẽ nạp `.env.development`.*

### 3. Khởi động Tài nguyên (Docker)

```bash
docker-compose up -d
```

- **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (User/Pass: `admin`/`admin123`)

### 4. Thiết lập Database (Prisma)

Dự án sử dụng kiến trúc multi-file schema. Để cập nhật Database:

```bash
# Đồng bộ schema với database
npx prisma db push

# Hoặc chạy migration (nếu dùng trong Production)
npx prisma migrate dev
```

## 🏃 Chạy ứng dụng

| Lệnh | Mô tả |
|------|-------|
| `npm run start:dev:api` | Chạy API Server (Watch mode) |
| `npm run start:dev:background` | Chạy Background Worker (Watch mode) |
| `npm run build` | Build toàn bộ dự án |

## 🏗 Kiến trúc tính năng (Vertical Slice + DDD)

Dự án áp dụng sự kết hợp giữa **Vertical Slice Architecture** và **Domain-Driven Design (DDD)** để giải quyết vấn đề mã nguồn phình to và khó bảo trì. Mỗi tính năng (Feature) là một đơn vị độc lập chứa đầy đủ các tầng từ Domain đến API.

### 1. Tầng Domain (Core) - `features/[feature]/domain`

Đây là trái tim của hệ thống, chứa logic nghiệp vụ thuần túy, không phụ thuộc vào bất kỳ framework hay database nào.

- **Entities**: Các đối tượng nghiệp vụ chính (Vd: `User`), đóng vai trò là **Aggregate Root** để đảm bảo tính toàn vẹn dữ liệu.
- **Value Objects**: Các đối tượng không có định danh, định nghĩa bằng thuộc tính của chúng (Vd: `Email`, `Role`). Giúp kiểm soát dữ liệu ngay từ cấp độ nguyên tử.
- **Repositories (Interfaces/Ports)**: Định nghĩa các hợp đồng truy xuất dữ liệu. Infrastructure sẽ thực thi các giao diện này.

### 2. Tầng Infrastructure (Adapters) - `features/[feature]/infrastructure`

Chứa các chi tiết thực thi kỹ thuật.

- **Repositories (Implementations)**: Thực thi logic truy vấn DB thực tế (Sử dụng Prisma).
- **External Services**: Tương tác với bên thứ ba như Google OAuth, AWS S3, v.v.
- **Security**: Các chiến lược xác thực (JWT Strategies, Passport).

### 3. Tầng Use Cases (Application) - `features/[feature]/use-cases`

Đóng vai trò là tầng điều phối (Orchestration). Mỗi thư mục con đại diện cho một chức năng (Slice) duy nhất.

- **Handler**: Đóng vai trò là một **Application Service**. Nó tiếp nhận dữ liệu từ Endpoint, điều phối các Entity và Repository để hoàn thành một tác vụ nghiệp vụ.
- **Endpoint**: Đóng vai trò là **Controller**. Chịu trách nhiệm định nghĩa Route, Guard, và chuyển hướng yêu cầu tới Handler tương ứng.
- **DTOs**: Query và Command objects định nghĩa cấu trúc dữ liệu đầu vào.

### 4. Tại sao lại thiết kế như vậy?

- **Tránh "Fat Service"**: Thay vì một `UserService` khổng lồ nghìn dòng, chúng ta có các Use Case nhỏ gọn (Vd: `CreateUserHandler`, `LoginHandler`).
- **Dễ dàng Unit Test**: Tách biệt Domain giúp bạn viết test cho logic nghiệp vụ mà không cần quan tâm đến Database.
- **Khả năng thay thế**: Dễ dàng đổi `Prisma` sang `TypeORM` hoặc `MongoDB` chỉ bằng cách sửa đổi ở tầng Infrastructure mà không ảnh hưởng tới logic nghiệp vụ ở Domain và Use Case.

## 🔗 Message Patterns (RabbitMQ)

Dự án sử dụng RabbitMQ để giao tiếp giữa API và Background Worker:

| Pattern | Mô tả |
|---------|-------|
| `notification.send.push` | Gửi thông báo Push Notification |
| `email.send.confirmation` | Gửi Email xác nhận |
| `face.recognition.verify` | Gửi yêu cầu xác thực khuôn mặt |

## 📜 Tài liệu bổ sung

- [Prisma Commands](./docs/PRISMA_COMMANDS.md)
- [API Documentation](http://localhost:3000/api) (Swagger - Khi app đang chạy)
