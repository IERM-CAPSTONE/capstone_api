#!/bin/bash

# ===========================================
# Database Export Script
# Export PostgreSQL database to SQL file
# ===========================================

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL="${DATABASE_URL:-postgresql://postgres:admin123@localhost:5432/capstone_db}"

# Extract components from DATABASE_URL
DB_USER=$(echo $DB_URL | sed -n 's#.*://\([^:]*\):.*#\1#p')
DB_PASS=$(echo $DB_URL | sed -n 's#.*://[^:]*:\([^@]*\)@.*#\1#p')
DB_HOST=$(echo $DB_URL | sed -n 's#.*@\([^:]*\):.*#\1#p')
DB_PORT=$(echo $DB_URL | sed -n 's#.*:\([0-9]*\)/.*#\1#p')
DB_NAME=$(echo $DB_URL | sed -n 's#.*/\([^?]*\).*#\1#p')

# Default values if parsing fails
DB_USER=${DB_USER:-postgres}
DB_PASS=${DB_PASS:-admin123}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-capstone_db}

# Output directory
OUTPUT_DIR="./prisma/seed"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${OUTPUT_DIR}/backup_${TIMESTAMP}.sql"
LATEST_FILE="${OUTPUT_DIR}/backup_latest.sql"

# Create output directory if not exists
mkdir -p $OUTPUT_DIR

echo "🔄 Exporting database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   User: $DB_USER"
echo ""

# Export database
PGPASSWORD=$DB_PASS pg_dump \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    $DB_NAME > $OUTPUT_FILE

# Create a copy as latest
cp $OUTPUT_FILE $LATEST_FILE

# Get file size
FILE_SIZE=$(du -h $OUTPUT_FILE | cut -f1)

echo "✅ Export completed!"
echo "   File: $OUTPUT_FILE"
echo "   Size: $FILE_SIZE"
echo ""
echo "📝 Latest backup also saved to: $LATEST_FILE"
