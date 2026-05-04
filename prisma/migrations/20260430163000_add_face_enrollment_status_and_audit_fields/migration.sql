-- Sync legacy FaceEnrollment table with current Prisma schema
DO $$
BEGIN
    CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'LOCKED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "FaceImageRetentionPolicy" AS ENUM ('SHORT_TERM_14_DAYS', 'UNTIL_GRADUATION');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."FaceEnrollment"
ADD COLUMN IF NOT EXISTS "status" "EnrollmentStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT,
ADD COLUMN IF NOT EXISTS "verificationMethod" TEXT,
ADD COLUMN IF NOT EXISTS "verificationNote" TEXT,
ADD COLUMN IF NOT EXISTS "retentionPolicy" "FaceImageRetentionPolicy",
ADD COLUMN IF NOT EXISTS "faceImagePurgeAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "retentionConsentedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "supervisorName" TEXT,
ADD COLUMN IF NOT EXISTS "supervisorCode" TEXT,
ADD COLUMN IF NOT EXISTS "supervisorRole" TEXT;

CREATE INDEX IF NOT EXISTS "FaceEnrollment_status_idx" ON "public"."FaceEnrollment"("status");
CREATE INDEX IF NOT EXISTS "FaceEnrollment_approvedBy_idx" ON "public"."FaceEnrollment"("approvedBy");
