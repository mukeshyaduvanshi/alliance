-- AlterTable
ALTER TABLE "workflow_instances" ADD COLUMN     "escalated_at" TIMESTAMP(3),
ADD COLUMN     "escalated_by_role_id" TEXT;
