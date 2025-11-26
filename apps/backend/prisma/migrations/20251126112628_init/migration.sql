-- CreateTable
CREATE TABLE "addressInfo" (
    "addressInfoId" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "userId" INTEGER,
    "merchantId" INTEGER,

    CONSTRAINT "addressInfo_pkey" PRIMARY KEY ("addressInfoId")
);

-- AddForeignKey
ALTER TABLE "addressInfo" ADD CONSTRAINT "addressInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addressInfo" ADD CONSTRAINT "addressInfo_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("merchantId") ON DELETE SET NULL ON UPDATE CASCADE;
