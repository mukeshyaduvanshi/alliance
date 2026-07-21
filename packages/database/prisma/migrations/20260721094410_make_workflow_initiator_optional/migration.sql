-- DropForeignKey
ALTER TABLE "workflow_instances" DROP CONSTRAINT "workflow_instances_initiated_by_id_fkey";

-- AlterTable
ALTER TABLE "workflow_instances" ALTER COLUMN "initiated_by_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiated_by_id_fkey" FOREIGN KEY ("initiated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
