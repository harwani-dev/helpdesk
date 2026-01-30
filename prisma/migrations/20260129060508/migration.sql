/*
  Warnings:

  - You are about to drop the column `ticketId` on the `Activity` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_ticketId_fkey";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "ticketId";
