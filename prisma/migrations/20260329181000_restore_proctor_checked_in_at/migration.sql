-- Restore field expected by Prisma schema and repository mapping.
ALTER TABLE "ExamSession"
ADD COLUMN IF NOT EXISTS "proctorCheckedInAt" TIMESTAMP(3);
