/*
  Warnings:

  - You are about to drop the column `checkinTime` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `checkoutTime` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `currentLocation` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `identityId` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `isMatched` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `isValid` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `StudentExam` table. All the data in the column will be lost.
  - Added the required column `max_columns` to the `ExamRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_rows` to the `ExamRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_seats` to the `ExamRoom` table without a default value. This is not possible if the table is not empty.
  - Made the column `seatNumber` on table `StudentExam` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CHECKED_IN', 'MOVED');

-- CreateEnum
CREATE TYPE "ExamPart" AS ENUM ('PRACTICAL', 'THEORY');

-- DropForeignKey
ALTER TABLE "StudentExam" DROP CONSTRAINT "StudentExam_identityId_fkey";

-- AlterTable
ALTER TABLE "ExamRoom" ADD COLUMN     "max_columns" INTEGER NOT NULL,
ADD COLUMN     "max_rows" INTEGER NOT NULL,
ADD COLUMN     "total_seats" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StudentExam" DROP COLUMN "checkinTime",
DROP COLUMN "checkoutTime",
DROP COLUMN "currentLocation",
DROP COLUMN "identityId",
DROP COLUMN "isMatched",
DROP COLUMN "isValid",
DROP COLUMN "status",
ALTER COLUMN "seatNumber" SET NOT NULL,
ALTER COLUMN "seatNumber" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "ActivityHistory" (
    "id" TEXT NOT NULL,
    "studentExamId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExamPart" (
    "id" TEXT NOT NULL,
    "studentExamId" TEXT NOT NULL,
    "isInRoom" BOOLEAN NOT NULL DEFAULT false,
    "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TIMESTAMP(3),
    "examPart" "ExamPart" NOT NULL,
    "isSubmit" BOOLEAN NOT NULL DEFAULT false,
    "submitTime" TIMESTAMP(3),
    "isSign" BOOLEAN NOT NULL DEFAULT false,
    "signTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExamPart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityHistory_studentExamId_idx" ON "ActivityHistory"("studentExamId");

-- CreateIndex
CREATE INDEX "ActivityHistory_ticketId_idx" ON "ActivityHistory"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityHistory_studentExamId_ticketId_key" ON "ActivityHistory"("studentExamId", "ticketId");

-- CreateIndex
CREATE INDEX "StudentExamPart_studentExamId_idx" ON "StudentExamPart"("studentExamId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExamPart_studentExamId_examPart_key" ON "StudentExamPart"("studentExamId", "examPart");

-- AddForeignKey
ALTER TABLE "ActivityHistory" ADD CONSTRAINT "ActivityHistory_studentExamId_fkey" FOREIGN KEY ("studentExamId") REFERENCES "StudentExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHistory" ADD CONSTRAINT "ActivityHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "IssueTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExamPart" ADD CONSTRAINT "StudentExamPart_studentExamId_fkey" FOREIGN KEY ("studentExamId") REFERENCES "StudentExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
