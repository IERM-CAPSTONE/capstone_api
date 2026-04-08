CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "Identity" ALTER COLUMN "activeVector" TYPE vector(512) USING "activeVector"::text::vector(512);
