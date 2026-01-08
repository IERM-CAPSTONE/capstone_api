#!/bin/bash

# ===========================================
# Prisma Migration Script
# Chạy script này sau khi sửa model trong schema
# ===========================================

set -e  # Dừng ngay nếu có lỗi

echo "🔍 Validating schema..."
npx prisma validate

echo ""
echo "📝 Enter migration name (e.g., add_user_field):"
read MIGRATION_NAME

if [ -z "$MIGRATION_NAME" ]; then
    echo "❌ Migration name is required!"
    exit 1
fi

echo ""
echo "🔄 Creating migration: $MIGRATION_NAME"
npx prisma migrate dev --name "$MIGRATION_NAME"

echo ""
echo "✅ Done! Migration '$MIGRATION_NAME' created and applied."
