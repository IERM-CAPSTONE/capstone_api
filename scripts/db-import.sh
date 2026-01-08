#!/bin/bash

# ===========================================
# Database Import Script
# Import SQL file to PostgreSQL database
# ===========================================

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Parse DATABASE_URL
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

# Input file
INPUT_FILE="${1:-./prisma/seed/backup_latest.sql}"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: File not found: $INPUT_FILE"
    echo ""
    echo "Usage: ./scripts/db-import.sh [path/to/backup.sql]"
    echo "       ./scripts/db-import.sh                      # Uses backup_latest.sql"
    exit 1
fi

echo "🔄 Importing database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   User: $DB_USER"
echo "   File: $INPUT_FILE"
echo ""

# Check if database exists, create if not
echo "📦 Checking database..."
PGPASSWORD=$DB_PASS psql \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASS createdb \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    $DB_NAME

# Import database
echo "📥 Importing data..."
PGPASSWORD=$DB_PASS psql \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    -d $DB_NAME \
    -f $INPUT_FILE \
    --quiet

echo ""
echo "✅ Import completed!"
echo ""

# Show table counts
echo "📊 Table summary:"
PGPASSWORD=$DB_PASS psql \
    -U $DB_USER \
    -h $DB_HOST \
    -p $DB_PORT \
    -d $DB_NAME \
    -c "SELECT tablename AS table, 
        (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) AS columns
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != '_prisma_migrations'
        ORDER BY tablename;"
