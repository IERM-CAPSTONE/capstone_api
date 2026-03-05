/*
  Warnings:

  - You are about to drop the column `examType` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `faceVector` on the `Identity` table. All the data in the column will be lost.
  - You are about to drop the column `examType` on the `StudentExamPart` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Identity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentExamId,examTypeId]` on the table `StudentExamPart` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "StudentExamPart_studentExamId_examType_key";

-- AlterTable
ALTER TABLE "ExamRoom" ADD COLUMN     "campus" "Campus";

-- AlterTable
ALTER TABLE "ExamSession" DROP COLUMN "examType",
DROP COLUMN "semester",
ADD COLUMN     "campus" "Campus",
ADD COLUMN     "semesterId" TEXT;

-- AlterTable
ALTER TABLE "Identity" DROP COLUMN "faceVector",
ADD COLUMN     "activeVector" JSONB,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "StudentExamPart" DROP COLUMN "examType",
ADD COLUMN     "examTypeId" TEXT;

-- DropEnum
DROP TYPE "ExamType";

-- CreateTable
CREATE TABLE "ExamType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "semesterId" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectPart" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExamSessionToExamType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExamSessionToExamType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamType_code_key" ON "ExamType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_code_key" ON "Semester"("code");

-- CreateIndex
CREATE INDEX "Semester_code_idx" ON "Semester"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_code_idx" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_semesterId_idx" ON "Subject"("semesterId");

-- CreateIndex
CREATE INDEX "SubjectPart_subjectId_idx" ON "SubjectPart"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectPart_examTypeId_idx" ON "SubjectPart"("examTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectPart_subjectId_examTypeId_key" ON "SubjectPart"("subjectId", "examTypeId");

-- CreateIndex
CREATE INDEX "_ExamSessionToExamType_B_index" ON "_ExamSessionToExamType"("B");

-- CreateIndex
CREATE INDEX "ExamRoom_campus_idx" ON "ExamRoom"("campus");

-- CreateIndex
CREATE INDEX "ExamSession_semesterId_idx" ON "ExamSession"("semesterId");

-- CreateIndex
CREATE INDEX "ExamSession_campus_idx" ON "ExamSession"("campus");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_userId_key" ON "Identity"("userId");

-- CreateIndex
CREATE INDEX "StudentExamPart_examTypeId_idx" ON "StudentExamPart"("examTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExamPart_studentExamId_examTypeId_key" ON "StudentExamPart"("studentExamId", "examTypeId");
