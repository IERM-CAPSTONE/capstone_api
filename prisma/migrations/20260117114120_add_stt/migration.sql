/*
  Warnings:

  - The values [PRACTICAL,THEORY] on the enum `ExamPart` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExamPart_new" AS ENUM ('PE', 'TE', 'S', 'L', 'R', 'W', 'FE');
ALTER TABLE "StudentExamPart" ALTER COLUMN "examPart" TYPE "ExamPart_new" USING ("examPart"::text::"ExamPart_new");
ALTER TYPE "ExamPart" RENAME TO "ExamPart_old";
ALTER TYPE "ExamPart_new" RENAME TO "ExamPart";
DROP TYPE "public"."ExamPart_old";
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
