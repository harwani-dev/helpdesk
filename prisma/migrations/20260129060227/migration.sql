/*
  Warnings:

  - The values [STATUS_CHANGED] on the enum `ActivityType` will be removed. If these variants are still used in the database, this will fail.
  - The values [GENERAL] on the enum `HrType` will be removed. If these variants are still used in the database, this will fail.
  - The values [INCIDENT,SERVICE_REQUEST,ACCESS_REQUEST] on the enum `ItType` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `ticketId` on table `Activity` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('FORWARDED_TO_MANAGER', 'FORWARDED_TO_HR', 'FORWARDED_TO_IT', 'REJECTED', 'EXPIRED', 'CLOSED', 'RESOLVED');

-- AlterEnum
BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('TICKET_OPENED', 'TICKET_CLOSED', 'TICKET_APPROVED', 'TICKET_REJECTED', 'TICKET_REOPENED', 'TICKET_ASSIGNED');
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "public"."ActivityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "HrType_new" AS ENUM ('LEAVE_BALANCE', 'LEAVE_POLICY', 'PAYROLL', 'PF', 'KEKA_ISSUES', 'SODEXO_FOOD_COUPONS', 'HEALTH_INSURANCE', 'ANY_FORM_OF_LETTER', 'REFERRAL_APPLICATION', 'COURSE_PURCHASE', 'BANK_ACCOUNT_ISSUE');
ALTER TABLE "Ticket" ALTER COLUMN "hrType" TYPE "HrType_new" USING ("hrType"::text::"HrType_new");
ALTER TYPE "HrType" RENAME TO "HrType_old";
ALTER TYPE "HrType_new" RENAME TO "HrType";
DROP TYPE "public"."HrType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ItType_new" AS ENUM ('LAPTOP_BOOTUP', 'LAPTOP_CHARGER_NOT_WORKING', 'LAPTOP_BATTERY_LIFE', 'ADD_RAM', 'NEW_MONITOR', 'NEW_KEYBOARD', 'NEW_MOUSE', 'MOBILE_PHONE_ISSUE', 'MOBILE_DATA_CABLE_ISSUE', 'HARD_DISK_FAILURE');
ALTER TABLE "Ticket" ALTER COLUMN "itType" TYPE "ItType_new" USING ("itType"::text::"ItType_new");
ALTER TYPE "ItType" RENAME TO "ItType_old";
ALTER TYPE "ItType_new" RENAME TO "ItType";
DROP TYPE "public"."ItType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_ticketId_fkey";

-- DropIndex
DROP INDEX "Activity_ticketId_createdAt_idx";

-- DropIndex
DROP INDEX "Activity_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "ticketId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "TicketStatus" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
