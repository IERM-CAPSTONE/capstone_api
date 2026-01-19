/*
  Warnings:

  - The values [PRACTICAL,THEORY] on the enum `ExamType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExamType_new" AS ENUM ('PE', 'TE', 'S', 'L', 'R', 'W', 'FE');
ALTER TABLE "StudentExamPart" ALTER COLUMN "examType" TYPE "ExamType_new" USING ("examType"::text::"ExamType_new");
ALTER TYPE "ExamType" RENAME TO "ExamType_old";
ALTER TYPE "ExamType_new" RENAME TO "ExamType";
DROP TYPE "public"."ExamType_old";
COMMIT;

-- AlterTable (use IF NOT EXISTS to tolerate existing columns)
ALTER TABLE "StudentExam" 
  ADD COLUMN IF NOT EXISTS "checkinTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkoutTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "currentLocation" TEXT,
  ADD COLUMN IF NOT EXISTS "identityId" TEXT,
  ADD COLUMN IF NOT EXISTS "isMatched" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isValid" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "status" "StudentExamStatus" NOT NULL DEFAULT 'REGISTERED',
  ADD COLUMN IF NOT EXISTS "stt" INTEGER;
