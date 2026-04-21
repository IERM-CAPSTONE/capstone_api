/*
  Warnings:

  - The `seatNumber` column on the `StudentExam` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ExamRoom" ALTER COLUMN "max_columns" DROP NOT NULL,
ALTER COLUMN "max_rows" DROP NOT NULL,
ALTER COLUMN "total_seats" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentExam" ADD COLUMN     "checkinTime" TIMESTAMP(3),
ADD COLUMN     "checkoutTime" TIMESTAMP(3),
ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "identityId" TEXT,
ADD COLUMN     "isMatched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isValid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "StudentExamStatus" NOT NULL DEFAULT 'REGISTERED',
DROP COLUMN "seatNumber",
ADD COLUMN     "seatNumber" INTEGER;
