/*
  Warnings:

  - You are about to drop the column `location` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `registeredBy` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `toId` on the `Notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomNumber,campus]` on the table `ExamRoom` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toUserId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'WARNING', 'URGENT');

-- CreateEnum
CREATE TYPE "DeviceApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HALL_INVIGILATOR';

-- DropIndex
DROP INDEX "Device_registeredBy_idx";

-- DropIndex
DROP INDEX "ExamRoom_roomNumber_key";

-- DropIndex
DROP INDEX "Notification_toId_idx";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "location",
DROP COLUMN "registeredBy",
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "hasStudentsImported" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "IssueTicket" ADD COLUMN     "priority" TEXT DEFAULT 'Medium',
ADD COLUMN     "resolveNote" TEXT,
ADD COLUMN     "studentCode" TEXT,
ADD COLUMN     "techNote" TEXT;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "toId",
ADD COLUMN     "toUserId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AnnouncementTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'INFO',
    "campus" "Campus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnouncementTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceApplication" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "registeredBy" TEXT NOT NULL,
    "status" "DeviceApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementTemplate_campus_idx" ON "AnnouncementTemplate"("campus");

-- CreateIndex
CREATE INDEX "DeviceApplication_deviceId_idx" ON "DeviceApplication"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceApplication_registeredBy_idx" ON "DeviceApplication"("registeredBy");

-- CreateIndex
CREATE INDEX "DeviceApplication_approvedBy_idx" ON "DeviceApplication"("approvedBy");

-- CreateIndex
CREATE INDEX "DeviceApplication_status_idx" ON "DeviceApplication"("status");

-- CreateIndex
CREATE INDEX "Device_ownerId_idx" ON "Device"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_roomNumber_campus_key" ON "ExamRoom"("roomNumber", "campus");

-- CreateIndex
CREATE INDEX "Notification_toUserId_idx" ON "Notification"("toUserId");
