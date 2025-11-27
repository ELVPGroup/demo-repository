/*
  Warnings:

  - You are about to alter the column `phone` on the `addressInfo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(20)`.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'SHIPPED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PENDING', 'PACKING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELED');

-- AlterTable
ALTER TABLE "addressInfo" ALTER COLUMN "phone" SET DATA TYPE VARCHAR(20);

-- CreateTable
CREATE TABLE "products" (
    "productId" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "orders" (
    "orderId" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "merchantId" INTEGER,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "orderItems" (
    "orderItemId" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "orderItems_pkey" PRIMARY KEY ("orderItemId")
);

-- CreateTable
CREATE TABLE "orderDetail" (
    "orderId" INTEGER NOT NULL,
    "addressFromId" INTEGER NOT NULL,
    "addressToId" INTEGER NOT NULL,

    CONSTRAINT "orderDetail_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "timelineItems" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'PENDING',
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "timelineItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveryArea" (
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "radius" DECIMAL NOT NULL,
    "merchantId" INTEGER NOT NULL,

    CONSTRAINT "deliveryArea_pkey" PRIMARY KEY ("merchantId")
);

-- CreateIndex
CREATE UNIQUE INDEX "orderItems_orderId_productId_key" ON "orderItems"("orderId", "productId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("merchantId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderItems" ADD CONSTRAINT "orderItems_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderItems" ADD CONSTRAINT "orderItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderDetail" ADD CONSTRAINT "orderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderDetail" ADD CONSTRAINT "orderDetail_addressFromId_fkey" FOREIGN KEY ("addressFromId") REFERENCES "addressInfo"("addressInfoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderDetail" ADD CONSTRAINT "orderDetail_addressToId_fkey" FOREIGN KEY ("addressToId") REFERENCES "addressInfo"("addressInfoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelineItems" ADD CONSTRAINT "timelineItems_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orderDetail"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveryArea" ADD CONSTRAINT "deliveryArea_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;
