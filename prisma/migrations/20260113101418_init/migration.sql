/*
  Warnings:

  - You are about to drop the column `floorArea` on the `ExamRoom` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomNumber]` on the table `ExamRoom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ExamRoom" DROP COLUMN "floorArea";

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_roomNumber_key" ON "ExamRoom"("roomNumber");

-- CreateIndex
CREATE INDEX "ExamSession_examOpenTime_examCloseTime_idx" ON "ExamSession"("examOpenTime", "examCloseTime");

-- CreateIndex
CREATE UNIQUE INDEX "User_code_key" ON "User"("code");
