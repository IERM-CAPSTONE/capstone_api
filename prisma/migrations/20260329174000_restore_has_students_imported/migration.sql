-- Restore field expected by current Prisma schema and runtime mappings.
ALTER TABLE "ExamSession"
ADD COLUMN IF NOT EXISTS "hasStudentsImported" BOOLEAN NOT NULL DEFAULT false;
