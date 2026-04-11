CREATE TYPE "AttendanceActorType" AS ENUM ('STUDENT', 'PROCTOR');

CREATE TYPE "AttendanceSnapshotStatus" AS ENUM ('MATCHED', 'NOT_MATCHED', 'WRONG_ROOM', 'FAILED');

CREATE TABLE "AttendanceSnapshot" (
    "id" TEXT NOT NULL,
    "actorType" "AttendanceActorType" NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "examPartCode" TEXT,
    "capturedUserId" TEXT,
    "matchedUserId" TEXT,
    "status" "AttendanceSnapshotStatus" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "captureTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AttendanceSnapshot_examSessionId_idx" ON "AttendanceSnapshot"("examSessionId");
CREATE INDEX "AttendanceSnapshot_status_idx" ON "AttendanceSnapshot"("status");
CREATE INDEX "AttendanceSnapshot_matchedUserId_idx" ON "AttendanceSnapshot"("matchedUserId");
CREATE INDEX "AttendanceSnapshot_captureTimestamp_idx" ON "AttendanceSnapshot"("captureTimestamp");
