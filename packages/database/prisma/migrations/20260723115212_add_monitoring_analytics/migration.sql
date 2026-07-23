-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SLA_BREACH', 'NEGOTIATION_STUCK', 'APPROVAL_OVERDUE', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "assigned_kam_id" TEXT;

-- CreateTable
CREATE TABLE "sla_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applies_to_status" "OrderStatus" NOT NULL,
    "threshold_hours" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exception_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "message" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exception_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sla_rules_tenant_id_applies_to_status_key" ON "sla_rules"("tenant_id", "applies_to_status");

-- CreateIndex
CREATE INDEX "exception_alerts_tenant_id_is_resolved_idx" ON "exception_alerts"("tenant_id", "is_resolved");

-- CreateIndex
CREATE INDEX "exception_alerts_entity_type_entity_id_idx" ON "exception_alerts"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_assigned_kam_id_fkey" FOREIGN KEY ("assigned_kam_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_rules" ADD CONSTRAINT "sla_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_alerts" ADD CONSTRAINT "exception_alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_alerts" ADD CONSTRAINT "exception_alerts_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
