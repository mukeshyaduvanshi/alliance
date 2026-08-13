-- AlterTable
ALTER TABLE "vendor_product_rates" ADD COLUMN "is_custom_rate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "custom_rate" DECIMAL(10,2);