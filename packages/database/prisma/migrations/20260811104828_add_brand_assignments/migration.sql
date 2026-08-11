-- CreateTable
CREATE TABLE "brand_assignments" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_assignments_user_id_idx" ON "brand_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_assignments_brand_id_user_id_key" ON "brand_assignments"("brand_id", "user_id");

-- AddForeignKey
ALTER TABLE "brand_assignments" ADD CONSTRAINT "brand_assignments_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_assignments" ADD CONSTRAINT "brand_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
