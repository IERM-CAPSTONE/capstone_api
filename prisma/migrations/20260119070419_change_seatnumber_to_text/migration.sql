/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `seatNumber` on table `StudentExam` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "examCode" TEXT,
ADD COLUMN     "openCode" TEXT;

-- AlterTable
ALTER TABLE "StudentExam" ALTER COLUMN "seatNumber" SET NOT NULL,
ALTER COLUMN "seatNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
