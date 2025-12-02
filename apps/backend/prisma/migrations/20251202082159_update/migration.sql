-- CreateTable
CREATE TABLE "logisticsProviders" (
    "logisticsId" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "logisticsProviders_pkey" PRIMARY KEY ("logisticsId")
);

-- CreateTable
CREATE TABLE "_LogisticsProviderToMerchant" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LogisticsProviderToMerchant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "logisticsProviders_name_key" ON "logisticsProviders"("name");

-- CreateIndex
CREATE INDEX "_LogisticsProviderToMerchant_B_index" ON "_LogisticsProviderToMerchant"("B");

-- AddForeignKey
ALTER TABLE "_LogisticsProviderToMerchant" ADD CONSTRAINT "_LogisticsProviderToMerchant_A_fkey" FOREIGN KEY ("A") REFERENCES "logisticsProviders"("logisticsId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LogisticsProviderToMerchant" ADD CONSTRAINT "_LogisticsProviderToMerchant_B_fkey" FOREIGN KEY ("B") REFERENCES "merchants"("merchantId") ON DELETE CASCADE ON UPDATE CASCADE;
