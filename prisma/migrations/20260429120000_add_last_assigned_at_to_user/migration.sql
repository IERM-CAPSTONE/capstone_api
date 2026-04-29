-- Add missing nullable column used by the current Prisma User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastAssignedAt" TIMESTAMP(3);