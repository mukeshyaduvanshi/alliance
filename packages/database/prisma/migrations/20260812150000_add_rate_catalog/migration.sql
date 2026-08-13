-- CreateEnum
CREATE TYPE "RateUnit" AS ENUM ('INCH', 'CM', 'MM', 'METER', 'FOOT', 'SQ_FT', 'SQ_M', 'KILOGRAM', 'OTHER');

-- CreateTable
CREATE TABLE "rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "calc_unit" "RateUnit" NOT NULL,
    "calc_value" DECIMAL(12,4),
    "meas_unit" "RateUnit" NOT NULL,
    "meas_value" DECIMAL(12,4),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_region_rates" (
    "id" TEXT NOT NULL,
    "rate_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "rate_region_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "rate_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "rate_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rates_tenant_id_label_key" ON "rates"("tenant_id", "label");

-- CreateIndex
CREATE INDEX "rates_tenant_id_is_active_idx" ON "rates"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "rate_region_rates_rate_id_region_key" ON "rate_region_rates"("rate_id", "region");

-- CreateIndex
CREATE UNIQUE INDEX "brand_rates_brand_id_rate_id_region_key" ON "brand_rates"("brand_id", "rate_id", "region");

-- CreateIndex
CREATE INDEX "brand_rates_tenant_id_brand_id_idx" ON "brand_rates"("tenant_id", "brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_rates_vendor_id_rate_id_region_key" ON "vendor_rates"("vendor_id", "rate_id", "region");

-- CreateIndex
CREATE INDEX "vendor_rates_tenant_id_vendor_id_idx" ON "vendor_rates"("tenant_id", "vendor_id");

-- AddForeignKey
ALTER TABLE "rate_region_rates" ADD CONSTRAINT "rate_region_rates_rate_id_fkey" FOREIGN KEY ("rate_id") REFERENCES "rates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_rates" ADD CONSTRAINT "brand_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_rates" ADD CONSTRAINT "brand_rates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_rates" ADD CONSTRAINT "brand_rates_rate_id_fkey" FOREIGN KEY ("rate_id") REFERENCES "rates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_rates" ADD CONSTRAINT "vendor_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_rates" ADD CONSTRAINT "vendor_rates_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_rates" ADD CONSTRAINT "vendor_rates_rate_id_fkey" FOREIGN KEY ("rate_id") REFERENCES "rates"("id") ON DELETE CASCADE ON UPDATE CASCADE;