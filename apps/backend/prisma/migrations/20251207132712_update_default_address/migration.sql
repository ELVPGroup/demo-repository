-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "defaultAddressId" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "defaultAddressId" INTEGER;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultAddressId_fkey" FOREIGN KEY ("defaultAddressId") REFERENCES "addressInfo"("addressInfoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_defaultAddressId_fkey" FOREIGN KEY ("defaultAddressId") REFERENCES "addressInfo"("addressInfoId") ON DELETE SET NULL ON UPDATE CASCADE;
