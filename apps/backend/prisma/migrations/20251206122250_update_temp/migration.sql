-- AlterTable
ALTER TABLE "products" ADD COLUMN     "imageUrl" VARCHAR(255),
ADD COLUMN     "merchantId" INTEGER;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("merchantId") ON DELETE SET NULL ON UPDATE CASCADE;
