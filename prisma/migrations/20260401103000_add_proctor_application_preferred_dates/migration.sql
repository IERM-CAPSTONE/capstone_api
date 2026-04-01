-- Update preferredDate column to support JSON array of ISO date strings
-- Changes column type from TIMESTAMP to TEXT to store JSON: ["2026-02-15", "2026-02-18"]

DO $$
BEGIN
    -- Only execute if column is still a timestamp
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ProctorApplication'
        AND column_name = 'preferredDate'
        AND data_type = 'timestamp without time zone'
    ) THEN
        -- Create temporary column
        ALTER TABLE "ProctorApplication"
        ADD COLUMN "preferredDate_new" TEXT NULL;

        -- Backfill: convert existing TIMESTAMP dates to JSON array format
        -- Where preferredDate is not null, convert to ["2026-02-15"] format
        UPDATE "ProctorApplication"
        SET "preferredDate_new" = jsonb_to_text(jsonb_build_array(to_char("preferredDate", 'YYYY-MM-DD')))
        WHERE "preferredDate" IS NOT NULL;

        -- Drop old column
        ALTER TABLE "ProctorApplication"
        DROP COLUMN "preferredDate";

        -- Rename new column
        ALTER TABLE "ProctorApplication"
        RENAME COLUMN "preferredDate_new" TO "preferredDate";
    END IF;
END $$;

