-- CreateEnum
CREATE TYPE "Campus" AS ENUM ('HCM', 'HN', 'DN', 'QN', 'CT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "campus" "Campus";

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_campus_idx" ON "User"("campus");
