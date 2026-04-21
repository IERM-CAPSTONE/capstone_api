-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('PE', 'FE', 'TE');

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "examType" "ExamType";
