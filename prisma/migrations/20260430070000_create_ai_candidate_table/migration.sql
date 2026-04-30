-- CreateTable AiCandidate for storing AI-generated suggestions on ticket handling
CREATE TABLE "AiCandidate" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "sourceActivityId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "issueCode" TEXT,
    "issueType" TEXT,
    "issueCustomText" TEXT,
    "resolutionCode" TEXT,
    "resolutionCustomText" TEXT,
    "responseText" TEXT,
    "techNote" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCandidate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiCandidate_ticketId_idx" ON "AiCandidate"("ticketId");
CREATE INDEX "AiCandidate_reviewStatus_idx" ON "AiCandidate"("reviewStatus");
CREATE INDEX "AiCandidate_sourceActivityId_idx" ON "AiCandidate"("sourceActivityId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'AiCandidate_ticketId_fkey'
    ) THEN
        ALTER TABLE "AiCandidate"
        ADD CONSTRAINT "AiCandidate_ticketId_fkey"
        FOREIGN KEY ("ticketId") REFERENCES "IssueTicket"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
    END IF;
END $$;
