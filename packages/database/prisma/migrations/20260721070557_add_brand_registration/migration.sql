-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'LLP', 'PUBLIC_LIMITED', 'OTHER');

-- CreateEnum
CREATE TYPE "BrandApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "business_type" "BusinessType" NOT NULL,
    "pan_number" TEXT NOT NULL,
    "gst_number" TEXT,
    "msme_number" TEXT,
    "cin_number" TEXT NOT NULL,
    "pan_doc_url" TEXT,
    "gst_doc_url" TEXT,
    "msme_doc_url" TEXT,
    "cin_doc_Url" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "business_profile_id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "contact_person_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT,
    "logo_url" TEXT,
    "approval_status" "BrandApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "workflow_instance_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_pan_number_key" ON "business_profiles"("pan_number");

-- CreateIndex
CREATE UNIQUE INDEX "brands_business_profile_id_key" ON "brands"("business_profile_id");

-- CreateIndex
CREATE INDEX "brands_tenant_id_approval_status_idx" ON "brands"("tenant_id", "approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "brands_tenant_id_email_key" ON "brands"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
