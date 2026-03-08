/*
  Warnings:

  - You are about to drop the column `hasStudentsImported` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `ExamSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExamSession" DROP COLUMN "hasStudentsImported",
DROP COLUMN "isArchived",
ALTER COLUMN "status" SET DEFAULT 'Draft';

-- CreateTable
CREATE TABLE "_ExamPartToExamSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExamPartToExamSession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ExamPartToExamSession_B_index" ON "_ExamPartToExamSession"("B");
