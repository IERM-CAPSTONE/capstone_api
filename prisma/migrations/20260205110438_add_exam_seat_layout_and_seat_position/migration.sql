-- CreateEnum
CREATE TYPE "ExamSeatStatus" AS ENUM ('Available', 'Locked', 'Assigned', 'Present', 'Absent');

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'SEAT_MOVED';

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "hasStudentsImported" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StudentExam" ADD COLUMN     "seatPosition" TEXT;

-- CreateTable
CREATE TABLE "ExamSeat" (
    "id" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "status" "ExamSeatStatus" NOT NULL DEFAULT 'Available',

    CONSTRAINT "ExamSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamSeat_examSessionId_idx" ON "ExamSeat"("examSessionId");

-- CreateIndex
CREATE INDEX "ExamSeat_status_idx" ON "ExamSeat"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSeat_examSessionId_row_col_key" ON "ExamSeat"("examSessionId", "row", "col");

-- CreateIndex
CREATE INDEX "StudentExam_seatPosition_idx" ON "StudentExam"("seatPosition");
