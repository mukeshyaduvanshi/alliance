/*
  Warnings:

  - You are about to drop the column `rate` on the `brand_product_rates` table. All the data in the column will be lost.
  - Added the required column `region` to the `brand_product_rates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Region" AS ENUM ('PAN_INDIA', 'NORTH_INDIA', 'SOUTH_INDIA', 'EAST_INDIA', 'WEST_INDIA', 'KERALA');

-- AlterTable
ALTER TABLE "brand_product_rates" DROP COLUMN "rate",
ADD COLUMN     "custom_rate" DECIMAL(10,2),
ADD COLUMN     "is_custom_rate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "region" "Region" NOT NULL;

-- CreateTable
CREATE TABLE "product_region_rates" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_region_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_region_rates" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_region_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_region_rates_product_id_region_key" ON "product_region_rates"("product_id", "region");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_region_rates_product_id_region_key" ON "vendor_region_rates"("product_id", "region");

-- AddForeignKey
ALTER TABLE "product_region_rates" ADD CONSTRAINT "product_region_rates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_region_rates" ADD CONSTRAINT "vendor_region_rates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
