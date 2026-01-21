-- AlterEnum
ALTER TYPE "ExamType" ADD VALUE 'RE';

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "note" TEXT,
ADD COLUMN     "semester" TEXT;
