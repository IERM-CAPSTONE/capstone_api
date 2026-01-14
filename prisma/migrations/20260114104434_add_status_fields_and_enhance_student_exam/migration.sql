/*
  Warnings:

  - You are about to drop the column `examId` on the `StudentExam` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[examSessionId,studentId]` on the table `StudentExam` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `examSessionId` to the `StudentExam` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamRoomStatus" AS ENUM ('Available', 'Occupied', 'Maintenance', 'Exam_Ongoing', 'For_Exam');

-- CreateEnum
CREATE TYPE "ExamSessionStatus" AS ENUM ('Ongoing', 'Ended', 'Scheduled');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'IT_SUPPORT';

-- DropForeignKey
ALTER TABLE "StudentExam" DROP CONSTRAINT "StudentExam_examId_fkey";

-- DropIndex
DROP INDEX "StudentExam_examId_idx";

-- DropIndex
DROP INDEX "StudentExam_examId_studentId_key";

-- AlterTable
ALTER TABLE "ExamRoom" ADD COLUMN     "status" "ExamRoomStatus" NOT NULL DEFAULT 'Available';

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "status" "ExamSessionStatus" NOT NULL DEFAULT 'Scheduled';

-- AlterTable
ALTER TABLE "StudentExam" DROP COLUMN "examId",
ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "examSessionId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "StudentExam_examSessionId_idx" ON "StudentExam"("examSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExam_examSessionId_studentId_key" ON "StudentExam"("examSessionId", "studentId");

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
