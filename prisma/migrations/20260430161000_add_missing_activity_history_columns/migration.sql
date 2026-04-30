-- Bring legacy ActivityHistory table in sync with prisma/schema/activity_history.prisma
ALTER TABLE "public"."ActivityHistory"
ADD COLUMN IF NOT EXISTS "actorId" TEXT,
ADD COLUMN IF NOT EXISTS "fromAssigneeId" TEXT,
ADD COLUMN IF NOT EXISTS "toAssigneeId" TEXT,
ADD COLUMN IF NOT EXISTS "note" TEXT;

CREATE INDEX IF NOT EXISTS "ActivityHistory_actorId_idx" ON "public"."ActivityHistory"("actorId");
