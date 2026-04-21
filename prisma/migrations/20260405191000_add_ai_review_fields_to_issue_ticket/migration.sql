ALTER TABLE "IssueTicket"
ADD COLUMN "finalIssueCustomText" TEXT,
ADD COLUMN "resolutionCustomText" TEXT,
ADD COLUMN "needsAiReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aiTrainingStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN "reviewedBy" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewNote" TEXT;
