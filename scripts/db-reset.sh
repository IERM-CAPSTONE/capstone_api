#!/bin/bash

# ===========================================
# Database Reset Script
# Drop and recreate database, run migrations
# ===========================================

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Parse DATABASE_URL
DB_URL="${DATABASE_URL:-postgresql://postgres:admin123@localhost:5432/capstone_db}"

# Extract components
DB_USER=$(echo $DB_URL | sed -n 's#.*://\([^:]*\):.*#\1#p')
DB_PASS=$(echo $DB_URL | sed -n 's#.*://[^:]*:\([^@]*\)@.*#\1#p')
DB_HOST=$(echo $DB_URL | sed -n 's#.*@\([^:]*\):.*#\1#p')
DB_PORT=$(echo $DB_URL | sed -n 's#.*:\([0-9]*\)/.*#\1#p')
DB_NAME=$(echo $DB_URL | sed -n 's#.*/\([^?]*\).*#\1#p')

# Default values
DB_USER=${DB_USER:-postgres}
DB_PASS=${DB_PASS:-admin123}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-capstone_db}

echo "⚠️  WARNING: This will DROP and recreate the database!"
echo "   Database: $DB_NAME"
echo ""
read -p "Are you sure? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🗑️  Dropping database: $DB_NAME"

# Drop database
PGPASSWORD=$DB_PASS psql \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

echo "📦 Creating database: $DB_NAME"

# Create database
PGPASSWORD=$DB_PASS createdb \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    $DB_NAME

echo "🔄 Running Prisma migrations..."

# Run migrations
npx prisma migrate deploy

echo ""
echo "✅ Database reset completed!"
echo ""

# Show tables
echo "📋 Created tables:"
PGPASSWORD=$DB_PASS psql \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    -d $DB_NAME \
    -c "\dt"
