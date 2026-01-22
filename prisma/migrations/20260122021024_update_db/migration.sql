/*
  Warnings:

  - You are about to drop the column `activeVector` on the `Identity` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Identity` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId]` on the table `Identity` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentId` to the `Identity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- DropIndex
DROP INDEX "Identity_userId_key";

-- AlterTable
ALTER TABLE "Identity" DROP COLUMN "activeVector",
DROP COLUMN "userId",
ADD COLUMN     "faceVector" vector(512),
ADD COLUMN     "studentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Identity_studentId_key" ON "Identity"("studentId");
