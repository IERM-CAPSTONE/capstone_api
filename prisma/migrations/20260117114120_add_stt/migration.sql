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

-- AlterTable
ALTER TABLE "StudentExam" ADD COLUMN     "checkinTime" TIMESTAMP(3),
ADD COLUMN     "checkoutTime" TIMESTAMP(3),
ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "identityId" TEXT,
ADD COLUMN     "isMatched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isValid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "StudentExamStatus" NOT NULL DEFAULT 'REGISTERED',
ADD COLUMN     "stt" INTEGER;
