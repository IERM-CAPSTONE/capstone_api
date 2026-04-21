/*
  Warnings:

  - You are about to drop the column `checkinTime` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `checkoutTime` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `currentLocation` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `identityId` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `isMatched` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `isValid` on the `StudentExam` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `StudentExam` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ExamSessionStatus" ADD VALUE 'Draft';

-- AlterTable
ALTER TABLE "StudentExam" DROP COLUMN "checkinTime",
DROP COLUMN "checkoutTime",
DROP COLUMN "currentLocation",
DROP COLUMN "identityId",
DROP COLUMN "isMatched",
DROP COLUMN "isValid",
DROP COLUMN "status";
