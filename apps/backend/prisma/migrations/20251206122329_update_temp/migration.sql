/*
  Warnings:

  - Made the column `merchantId` on table `products` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_merchantId_fkey";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "merchantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;
