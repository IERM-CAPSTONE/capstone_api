# 📚 Prisma CLI - Các lệnh quan trọng

## � Migration (Quan trọng nhất)

```bash
# Tạo migration mới (Development)
npx prisma migrate dev --name <tên_migration>

# Áp dụng migrations (Production)
npx prisma migrate deploy

# Reset database (XÓA TOÀN BỘ DATA!)
npx prisma migrate reset
```

## ⚡ Generate Client

```bash
# Generate Prisma Client sau khi thay đổi schema
npx prisma generate
```

## ✅ Validate & Format

```bash
# Kiểm tra schema hợp lệ
npx prisma validate

# Format schema
npx prisma format
```

## 🎨 Prisma Studio (GUI)

```bash
# Mở giao diện quản lý database
npx prisma studio
```

## 🗄️ Database Push (Prototype)

```bash
# Push schema trực tiếp (không tạo migration file)
npx prisma db push
```

---

## 📊 Tóm tắt

| Lệnh | Mô tả |
|------|-------|
| `prisma migrate dev --name xxx` | Tạo migration mới |
| `prisma migrate deploy` | Deploy migrations (prod) |
| `prisma generate` | Generate Prisma Client |
| `prisma validate` | Kiểm tra schema |
| `prisma studio` | Mở GUI |
| `prisma db push` | Push nhanh (dev only) |
