/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,email]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VendorApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "vendor_amount" DECIMAL(12,2),
ADD COLUMN     "vendor_rate_snapshot" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "vendor_total_amount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "approval_status" "VendorApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "business_profile_id" TEXT,
ADD COLUMN     "contact_person_name" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workflow_instance_id" TEXT;

-- CreateTable
CREATE TABLE "vendor_product_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_product_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_negotiations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "proposed_amount" DECIMAL(12,2) NOT NULL,
    "remarks" TEXT,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'PENDING',
    "responded_by_id" TEXT,
    "response_remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "order_negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_product_rates_vendor_id_product_id_key" ON "vendor_product_rates"("vendor_id", "product_id");

-- CreateIndex
CREATE INDEX "order_negotiations_order_id_idx" ON "order_negotiations"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_tenant_id_email_key" ON "vendors"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_product_rates" ADD CONSTRAINT "vendor_product_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_product_rates" ADD CONSTRAINT "vendor_product_rates_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_product_rates" ADD CONSTRAINT "vendor_product_rates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_negotiations" ADD CONSTRAINT "order_negotiations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_negotiations" ADD CONSTRAINT "order_negotiations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_negotiations" ADD CONSTRAINT "order_negotiations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_negotiations" ADD CONSTRAINT "order_negotiations_responded_by_id_fkey" FOREIGN KEY ("responded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
