-- AlterTable
ALTER TABLE "rates" DROP COLUMN IF EXISTS "calc_value",
DROP COLUMN IF EXISTS "meas_value",
ADD COLUMN "calc_width" DECIMAL(12,4),
ADD COLUMN "calc_height" DECIMAL(12,4),
ADD COLUMN "meas_width" DECIMAL(12,4),
ADD COLUMN "meas_height" DECIMAL(12,4);