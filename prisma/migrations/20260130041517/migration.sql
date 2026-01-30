/*
  Warnings:

  - The values [CLOSED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('FORWARDED_TO_MANAGER', 'FORWARDED_TO_HR', 'FORWARDED_TO_IT', 'APPROVED', 'REJECTED', 'EXPIRED', 'RESOLVED');
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
COMMIT;
