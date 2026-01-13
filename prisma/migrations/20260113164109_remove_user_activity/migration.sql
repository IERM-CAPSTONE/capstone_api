/*
  Warnings:

  - You are about to drop the `UserActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserActivity" DROP CONSTRAINT "UserActivity_userId_fkey";

-- DropTable
DROP TABLE "UserActivity";
