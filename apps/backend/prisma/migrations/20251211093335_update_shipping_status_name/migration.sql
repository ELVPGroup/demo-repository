/*
  Warnings:

  - The `shippingStatus` column on the `timelineItems` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "timelineItems" DROP COLUMN "shippingStatus",
ADD COLUMN     "shippingStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ShippingStatus";
