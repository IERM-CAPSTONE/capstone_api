-- AlterEnum - Add RE only if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'RE' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ExamPart')
  ) THEN
    ALTER TYPE "ExamPart" ADD VALUE 'RE';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "note" TEXT,
ADD COLUMN     "semester" TEXT;
