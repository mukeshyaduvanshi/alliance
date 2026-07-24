-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('INTERNAL_USER', 'BRAND', 'VENDOR');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "recipient_type" "NotificationRecipientType" NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_tenant_id_recipient_type_recipient_id_is_read_idx" ON "notifications"("tenant_id", "recipient_type", "recipient_id", "is_read");
