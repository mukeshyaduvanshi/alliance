-- CreateEnum
CREATE TYPE "BusinessModelType" AS ENUM ('VENDOR_MODEL', 'MEDIATOR_MODEL', 'HYBRID_MODEL');

-- CreateTable
CREATE TABLE "brand_business_model_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "business_model" "BusinessModelType" NOT NULL,
    "commission_percent" DECIMAL(5,2),
    "markup_percent" DECIMAL(5,2),
    "configured_by_id" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_business_model_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_business_model_configs_brand_id_key" ON "brand_business_model_configs"("brand_id");

-- AddForeignKey
ALTER TABLE "brand_business_model_configs" ADD CONSTRAINT "brand_business_model_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_business_model_configs" ADD CONSTRAINT "brand_business_model_configs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_business_model_configs" ADD CONSTRAINT "brand_business_model_configs_configured_by_id_fkey" FOREIGN KEY ("configured_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
