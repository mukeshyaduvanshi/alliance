-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_created_by_id_fkey";

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "created_by_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
