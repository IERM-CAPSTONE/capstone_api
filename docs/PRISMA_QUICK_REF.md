# 🚀 Prisma Quick Reference

## Workflow Cơ Bản

### 1️⃣ Thêm/Sửa Field

```bash
# Sửa file: prisma/schema/model-name.prisma
npx prisma migrate dev --name add_field_name
npm run start:dev:api
```

### 2️⃣ Thêm Table Mới

```bash
# Tạo file: prisma/schema/new-model.prisma
npx prisma migrate dev --name create_new_model
npm run start:dev:api
```

### 3️⃣ Quick Sync (Dev Only)

```bash
npx prisma db push
npm run start:dev:api
```

---

## Lệnh Thường Dùng

| Lệnh | Mô tả |
|------|-------|
| `npx prisma format` | Format schema files |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev --name xxx` | Tạo migration mới |
| `npx prisma migrate deploy` | Apply migrations (production) |
| `npx prisma migrate status` | Xem trạng thái migrations |
| `npx prisma migrate reset` | Reset database & migrations |
| `npx prisma db push` | Sync schema → DB (no migration) |
| `npx prisma db pull` | Sync DB → schema (introspection) |
| `npx prisma studio` | Mở GUI database browser |
| `npx prisma validate` | Validate schema syntax |

---

## Ví Dụ Thực Tế

### Thêm Field `phoneNumber` Vào User

```prisma
// prisma/schema/user.prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  phoneNumber String?  // ← Thêm dòng này
  // ...
}
```

```bash
npx prisma migrate dev --name add_phone_to_user
```

### Thêm Model Mới

```prisma
// prisma/schema/comment.prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  userId    String
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}
```

```bash
npx prisma migrate dev --name create_comment_table
```

---

## Checklist ✅

- [ ] Sửa schema file
- [ ] `npx prisma migrate dev --name xxx`
- [ ] Restart server
- [ ] Test API

---

## Xem Workflow Chi Tiết

```bash
# Xem file workflow đầy đủ
cat .agent/workflows/prisma-schema-update.md
```
