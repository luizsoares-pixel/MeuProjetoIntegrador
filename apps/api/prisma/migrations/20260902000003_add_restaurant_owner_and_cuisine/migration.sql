-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "cuisine_type" TEXT;
ALTER TABLE "restaurants" ADD COLUMN "owner_id" UUID;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
