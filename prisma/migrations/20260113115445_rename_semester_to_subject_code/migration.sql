/*
  Warnings:

  - You are about to drop the column `semesterCode` on the `ExamSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExamSession" DROP COLUMN "semesterCode",
ADD COLUMN     "subjectCode" TEXT;

-- CreateIndex
CREATE INDEX "ExamSession_subjectCode_idx" ON "ExamSession"("subjectCode");
