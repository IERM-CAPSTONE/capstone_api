-- Add AI metadata and final human-confirmed label fields for ticket learning loop
ALTER TABLE "IssueTicket"
ADD COLUMN "ocrText" TEXT,
ADD COLUMN "aiPredictedIssueName" TEXT,
ADD COLUMN "aiPredictedIssueType" TEXT,
ADD COLUMN "aiConfidence" DOUBLE PRECISION,
ADD COLUMN "aiDisplayMessage" TEXT,
ADD COLUMN "aiEvidenceText" TEXT,
ADD COLUMN "aiModelVersion" TEXT,
ADD COLUMN "finalIssueName" TEXT,
ADD COLUMN "finalIssueType" TEXT;
